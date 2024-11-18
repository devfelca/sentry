from __future__ import annotations

import inspect
import logging
from collections.abc import Generator, Mapping, Sequence
from pathlib import Path
from typing import TYPE_CHECKING, Any, NotRequired, Self, TypedDict, TypeVar

from django.conf import settings
from parsimonious.exceptions import ParseError
from parsimonious.grammar import Grammar
from parsimonious.nodes import Node, NodeVisitor, RegexNode

from sentry.grouping.utils import get_rule_bool
from sentry.stacktraces.functions import get_function_name_for_frame
from sentry.stacktraces.platform import get_behavior_family_for_platform
from sentry.utils.event_frames import find_stack_frames
from sentry.utils.glob import glob_match
from sentry.utils.safe import get_path
from sentry.utils.strings import unescape_string
from sentry.utils.tag_normalization import normalized_sdk_tag_from_event

logger = logging.getLogger(__name__)

T = TypeVar("T")

VERSION = 1

CONFIGS_DIR: Path = Path(__file__).with_name("configs")

# Grammar is defined in EBNF syntax.
fingerprinting_grammar = Grammar(
    r"""

fingerprinting_rules = line*

line = _ (comment / rule / empty) newline?

rule = _ matchers _ follow _ fingerprint

matchers       = matcher+
matcher        = _ negation? matcher_type sep argument
matcher_type   = key / quoted_key
argument       = quoted / unquoted

key                  = ~r"[a-zA-Z0-9_\.-]+"
quoted_key           = ~r"\"([a-zA-Z0-9_\.:-]+)\""

fingerprint    = fp_value+
fp_value        = _ fp_argument _ ","?
fp_argument    = fp_attribute / quoted / unquoted_no_comma
fp_attribute   = key "=" quoted

comment        = ~r"#[^\r\n]*"

quoted         = ~r'"([^"\\]*(?:\\.[^"\\]*)*)"'
unquoted       = ~r"\S+"
unquoted_no_comma = ~r"((?:\{\{\s*\S+\s*\}\})|(?:[^\s\{,]+))"

follow   = "->"
sep      = ":"
space    = " "
empty    = ""
negation = "!"
newline  = ~r"[\r\n]"
_        = space*

"""
)


class InvalidFingerprintingConfig(Exception):
    pass


class _MessageInfo(TypedDict):
    message: str


class _LogInfo(TypedDict):
    logger: NotRequired[str]
    level: NotRequired[str]


class _ExceptionInfo(TypedDict):
    type: str | None
    value: str | None


class _FrameInfo(TypedDict):
    function: str
    abs_path: str | None
    filename: str | None
    module: str | None
    package: str | None
    app: bool | None


class _SdkInfo(TypedDict):
    sdk: str


class _FamilyInfo(TypedDict):
    family: str


class _ReleaseInfo(TypedDict):
    release: str | None


class EventAccess:
    def __init__(self, event: Mapping[str, Any]) -> None:
        self.event = event
        self._exceptions: list[_ExceptionInfo] | None = None
        self._frames: list[_FrameInfo] | None = None
        self._messages: list[_MessageInfo] | None = None
        self._log_info: list[_LogInfo] | None = None
        self._toplevel: list[_MessageInfo | _ExceptionInfo] | None = None
        self._tags: list[dict[str, str]] | None = None
        self._sdk: list[_SdkInfo] | None = None
        self._family: list[_FamilyInfo] | None = None
        self._release: list[_ReleaseInfo] | None = None

    def get_messages(self) -> list[_MessageInfo]:
        if self._messages is None:
            self._messages = []
            message = get_path(self.event, "logentry", "formatted", filter=True)
            if message:
                self._messages.append({"message": message})
        return self._messages

    def get_log_info(self) -> list[_LogInfo]:
        if self._log_info is None:
            log_info: _LogInfo = {}
            logger = get_path(self.event, "logger", filter=True)
            if logger:
                log_info["logger"] = logger
            level = get_path(self.event, "level", filter=True)
            if level:
                log_info["level"] = level
            if log_info:
                self._log_info = [log_info]
            else:
                self._log_info = []
        return self._log_info

    def get_exceptions(self) -> list[_ExceptionInfo]:
        if self._exceptions is None:
            self._exceptions = []
            for exc in get_path(self.event, "exception", "values", filter=True) or ():
                self._exceptions.append(
                    {
                        "type": exc.get("type"),
                        "value": exc.get("value"),
                    }
                )
        return self._exceptions

    def get_frames(self) -> list[_FrameInfo]:
        if self._frames is None:
            self._frames = frames = []

            def _push_frame(frame: dict[str, object]) -> None:
                platform = frame.get("platform") or self.event.get("platform")
                func = get_function_name_for_frame(frame, platform)
                frames.append(
                    {
                        "function": func or "<unknown>",
                        "abs_path": frame.get("abs_path") or frame.get("filename"),
                        "filename": frame.get("filename"),
                        "module": frame.get("module"),
                        "package": frame.get("package"),
                        "app": frame.get("in_app"),
                    }
                )

            find_stack_frames(self.event, _push_frame)
        return self._frames

    def get_toplevel(self) -> list[_MessageInfo | _ExceptionInfo]:
        if self._toplevel is None:
            self._toplevel = [*self.get_messages(), *self.get_exceptions()]
        return self._toplevel

    def get_tags(self) -> list[dict[str, str]]:
        if self._tags is None:
            self._tags = [
                {"tags.%s" % k: v for (k, v) in get_path(self.event, "tags", filter=True) or ()}
            ]
        return self._tags

    def get_sdk(self) -> list[_SdkInfo]:
        if self._sdk is None:
            self._sdk = [{"sdk": normalized_sdk_tag_from_event(self.event)}]
        return self._sdk

    def get_family(self) -> list[_FamilyInfo]:
        self._family = self._family or [
            {"family": get_behavior_family_for_platform(self.event.get("platform"))}
        ]
        return self._family

    def get_release(self) -> list[_ReleaseInfo]:
        self._release = self._release or [{"release": self.event.get("release")}]
        return self._release

    def get_values(self, match_group: str) -> list[dict[str, Any]]:
        return getattr(self, "get_" + match_group)()


class FingerprintingRules:
    def __init__(
        self,
        rules: Sequence[FingerprintRule],
        changelog: Sequence[object] | None = None,
        version: int | None = None,
        bases: Sequence[str] | None = None,
    ) -> None:
        if version is None:
            version = VERSION
        self.version = version
        self.rules = rules
        self.changelog = changelog
        self.bases = bases or []

    def iter_rules(self, include_builtin: bool = True) -> Generator[FingerprintRule]:
        if self.rules:
            yield from self.rules
        if include_builtin:
            for base in self.bases:
                base_rules = FINGERPRINTING_BASES.get(base, [])
                yield from base_rules

    def get_fingerprint_values_for_event(self, event: dict[str, object]) -> None | object:
        if not (self.bases or self.rules):
            return None
        access = EventAccess(event)
        for rule in self.iter_rules():
            new_values = rule.get_fingerprint_values_for_event_access(access)
            if new_values is not None:
                return (rule,) + new_values
        return None

    @classmethod
    def _from_config_structure(
        cls, data: dict[str, Any], bases: Sequence[str] | None = None
    ) -> Self:
        version = data.get("version", VERSION)
        if version != VERSION:
            raise ValueError("Unknown version")
        return cls(
            rules=[FingerprintRule._from_config_structure(x) for x in data["rules"]],
            version=version,
            bases=bases,
        )

    def _to_config_structure(self, include_builtin: bool = False) -> dict[str, Any]:
        rules = self.iter_rules(include_builtin=include_builtin)

        return {"version": self.version, "rules": [x._to_config_structure() for x in rules]}

    def to_json(self, include_builtin: bool = False) -> dict[str, Any]:
        return self._to_config_structure(include_builtin=include_builtin)

    @classmethod
    def from_json(cls, value: dict[str, object], bases: Sequence[str] | None = None) -> Self:
        try:
            return cls._from_config_structure(value, bases=bases)
        except (LookupError, AttributeError, TypeError, ValueError) as e:
            raise ValueError("invalid fingerprinting config: %s" % e)

    @staticmethod
    def from_config_string(s: Any, bases: Sequence[str] | None = None) -> Any:
        try:
            tree = fingerprinting_grammar.parse(s)
        except ParseError as e:
            context = e.text[e.pos : e.pos + 33]
            if len(context) == 33:
                context = context[:-1] + "..."
            raise InvalidFingerprintingConfig(
                f'Invalid syntax near "{context}" (line {e.line()}, column {e.column()})'
            )
        return FingerprintingVisitor(bases=bases).visit(tree)


if TYPE_CHECKING:
    NodeVisitorBase = NodeVisitor[FingerprintingRules]
else:
    NodeVisitorBase = NodeVisitor


class BuiltInFingerprintingRules(FingerprintingRules):
    """
    A FingerprintingRules object that marks all of its rules as built-in
    """

    @staticmethod
    def from_config_string(s: str, bases: Sequence[str] | None = None) -> FingerprintingRules:
        fingerprinting_rules = FingerprintingRules.from_config_string(s, bases=bases)
        for r in fingerprinting_rules.rules:
            r.is_builtin = True
        return fingerprinting_rules

    @classmethod
    def _from_config_structure(
        cls, data: dict[str, object], bases: Sequence[str] | None = None
    ) -> Self:
        fingerprinting_rules = super()._from_config_structure(data, bases=bases)
        for r in fingerprinting_rules.rules:
            r.is_builtin = True
        return fingerprinting_rules


MATCHERS = {
    # discover field names
    "error.type": "type",
    "error.value": "value",
    "stack.module": "module",
    "stack.abs_path": "path",
    "stack.package": "package",
    "stack.function": "function",
    "message": "message",
    "logger": "logger",
    "level": "level",
    # fingerprinting shortened fields
    "type": "type",
    "value": "value",
    "module": "module",
    "path": "path",
    "package": "package",
    "function": "function",
    # fingerprinting specific fields
    "family": "family",
    "app": "app",
    "sdk": "sdk",
    "release": "release",
}


class FingerprintMatch:
    def __init__(self, key: str, pattern: str, negated: bool = False) -> None:
        if key.startswith("tags."):
            self.key = key
        else:
            try:
                self.key = MATCHERS[key]
            except KeyError:
                raise InvalidFingerprintingConfig("Unknown matcher '%s'" % key)
        self.pattern = pattern
        self.negated = negated

    @property
    def match_group(self) -> str:
        if self.key == "message":
            return "toplevel"
        if self.key in ("logger", "level"):
            return "log_info"
        if self.key in ("type", "value"):
            return "exceptions"
        if self.key.startswith("tags."):
            return "tags"
        if self.key == "sdk":
            return "sdk"
        if self.key == "family":
            return "family"
        if self.key == "release":
            return "release"
        return "frames"

    def matches(self, values: dict[str, Any]) -> bool:
        rv = self._positive_match(values)
        if self.negated:
            rv = not rv
        return rv

    def _positive_path_match(self, value: str | None) -> bool:
        if value is None:
            return False
        if glob_match(value, self.pattern, ignorecase=True, doublestar=True, path_normalize=True):
            return True
        if not value.startswith("/") and glob_match(
            "/" + value, self.pattern, ignorecase=True, doublestar=True, path_normalize=True
        ):
            return True
        return False

    def _positive_match(self, values: dict[str, Any]) -> bool:
        # path is special in that it tests against two values (abs_path and path)
        if self.key == "path":
            value = values.get("abs_path")
            if self._positive_path_match(value):
                return True
            alt_value = values.get("filename")
            if alt_value != value:
                if self._positive_path_match(value):
                    return True
            return False

        # message tests against value as well as this is what users expect
        if self.key == "message":
            for key in ("message", "value"):
                value = values.get(key)
                if value is not None and glob_match(value, self.pattern, ignorecase=True):
                    return True
            return False

        value = values.get(self.key)
        if value is None:
            return False
        elif self.key == "package":
            if self._positive_path_match(value):
                return True
        elif self.key == "family":
            flags = self.pattern.split(",")
            if "all" in flags or value in flags:
                return True
        elif self.key == "sdk":
            flags = self.pattern.split(",")
            if "all" in flags or value in flags:
                return True
        elif self.key == "release":
            if self._positive_path_match(value):
                return True
        elif self.key == "app":
            ref_val = get_rule_bool(self.pattern)
            if ref_val is not None and ref_val == value:
                return True
        elif glob_match(value, self.pattern, ignorecase=self.key in ("level", "value")):
            return True
        return False

    def _to_config_structure(self) -> list[str]:
        key = self.key
        if self.negated:
            key = "!" + key
        return [key, self.pattern]

    @classmethod
    def _from_config_structure(cls, obj: Sequence[str]) -> Self:
        key = obj[0]
        if key.startswith("!"):
            key = key[1:]
            negated = True
        else:
            negated = False
        return cls(key, obj[1], negated)

    @property
    def text(self) -> str:
        return '{}{}:"{}"'.format(
            self.negated and "!" or "",
            self.key,
            self.pattern,
        )


class FingerprintRule:
    def __init__(
        self,
        matchers: Sequence[FingerprintMatch],
        fingerprint: list[str],
        attributes: dict[str, Any],
        is_builtin: bool = False,
    ) -> None:
        self.matchers = matchers
        self.fingerprint = fingerprint
        self.attributes = attributes
        self.is_builtin = is_builtin

    def get_fingerprint_values_for_event_access(
        self, event_access: EventAccess
    ) -> None | tuple[list[str], dict[str, Any]]:
        by_match_group: dict[str, list[FingerprintMatch]] = {}
        for matcher in self.matchers:
            by_match_group.setdefault(matcher.match_group, []).append(matcher)

        for match_group, matchers in by_match_group.items():
            for values in event_access.get_values(match_group):
                if all(x.matches(values) for x in matchers):
                    break
            else:
                return None

        return self.fingerprint, self.attributes

    def _to_config_structure(self) -> dict[str, Any]:
        config_structure: dict[str, Any] = {
            "text": self.text,
            "matchers": [x._to_config_structure() for x in self.matchers],
            "fingerprint": self.fingerprint,
            "attributes": self.attributes,
        }

        # only adding this key if it's true to avoid having to change in a bazillion asserts
        if self.is_builtin:
            config_structure["is_builtin"] = True
        return config_structure

    @classmethod
    def _from_config_structure(cls, obj: dict[str, Any]) -> Self:
        return cls(
            [FingerprintMatch._from_config_structure(x) for x in obj["matchers"]],
            obj["fingerprint"],
            obj.get("attributes") or {},
            obj.get("is_builtin") or False,
        )

    def to_json(self) -> dict[str, Any]:
        return self._to_config_structure()

    @classmethod
    def from_json(cls, json: dict[str, object]) -> Self:
        return cls._from_config_structure(json)

    @property
    def text(self) -> str:
        return (
            '%s -> "%s" %s'
            % (
                " ".join(x.text for x in self.matchers),
                "".join(x for x in self.fingerprint),
                " ".join(f'{k}="{v}"' for (k, v) in sorted(self.attributes.items())),
            )
        ).rstrip()


class FingerprintingVisitor(NodeVisitorBase):
    visit_empty = lambda *a: None
    unwrapped_exceptions = (InvalidFingerprintingConfig,)

    def __init__(self, bases: Sequence[str] | None) -> None:
        self.bases = bases

    # a note on the typing of `children`
    # these are actually lists of sub-lists of the various types
    # so instead typed as tuples so unpacking works

    def visit_comment(self, node: Node, _: object) -> str:
        return node.text

    def visit_fingerprinting_rules(
        self, _: object, children: list[str | FingerprintRule | None]
    ) -> FingerprintingRules:
        changelog = []
        rules = []
        in_header = True
        for child in children:
            if isinstance(child, str):
                if in_header and child[:2] == "##":
                    changelog.append(child[2:].rstrip())
                else:
                    in_header = False
            elif child is not None:
                rules.append(child)
                in_header = False
        return FingerprintingRules(
            rules=rules,
            changelog=inspect.cleandoc("\n".join(changelog)).rstrip() or None,
            bases=self.bases,
        )

    def visit_line(
        self, _: object, children: tuple[object, list[FingerprintRule | str | None], object]
    ) -> FingerprintRule | str | None:
        _, line, _ = children
        comment_or_rule_or_empty = line[0]
        if comment_or_rule_or_empty:
            return comment_or_rule_or_empty
        return None

    def visit_rule(
        self,
        _: object,
        children: tuple[
            object, list[FingerprintMatch], object, object, object, tuple[list[str], dict[str, Any]]
        ],
    ) -> FingerprintRule:
        _, matcher, _, _, _, (fingerprint, attributes) = children
        return FingerprintRule(matcher, fingerprint, attributes)

    def visit_matcher(
        self, _: object, children: tuple[object, list[str], str, object, str]
    ) -> FingerprintMatch:
        _, negation, ty, _, argument = children
        return FingerprintMatch(ty, argument, bool(negation))

    def visit_matcher_type(self, _: object, children: list[str]) -> str:
        return children[0]

    def visit_argument(self, _: object, children: list[str]) -> str:
        return children[0]

    visit_fp_argument = visit_argument

    def visit_fingerprint(
        self, _: object, children: list[str | tuple[str, str]]
    ) -> tuple[list[str], dict[str, str]]:
        fingerprint = []
        attributes = {}
        for item in children:
            if isinstance(item, tuple):
                key, value = item
                attributes[key] = value
            else:
                fingerprint.append(item)
        return fingerprint, attributes

    def visit_fp_value(self, _: object, children: tuple[object, str, object, object]) -> str:
        _, argument, _, _ = children
        return argument

    def visit_fp_attribute(self, _: object, children: tuple[str, object, str]) -> tuple[str, str]:
        key, _, value = children
        if key != "title":
            raise InvalidFingerprintingConfig("Unknown attribute '%s'" % key)
        return (key, value)

    def visit_quoted(self, node: Node, _: object) -> str:
        return unescape_string(node.text[1:-1])

    def visit_unquoted(self, node: Node, _: object) -> str:
        return node.text

    visit_unquoted_no_comma = visit_unquoted

    def generic_visit(self, _: object, children: T) -> T:
        return children

    def visit_key(self, node: Node, _: object) -> str:
        return node.text

    def visit_quoted_key(self, node: RegexNode, _: object) -> str:
        # leading ! are used to indicate negation. make sure they don't appear.
        return node.match.groups()[0].lstrip("!")


def _load_configs() -> dict[str, list[FingerprintRule]]:
    if not CONFIGS_DIR.exists():
        logger.error(
            "Failed to load Fingerprinting Configs, invalid _config_dir: %s",
            CONFIGS_DIR,
        )
        if settings.DEBUG:
            raise Exception(
                f"Failed to load Fingerprinting Configs, invalid _config_dir: '{CONFIGS_DIR}'"
            )

    configs: dict[str, list[FingerprintRule]] = {}

    for config_file_path in sorted(CONFIGS_DIR.glob("**/*.txt")):
        config_name = config_file_path.parent.name
        configs.setdefault(config_name, [])

        try:
            with open(config_file_path) as config_file:
                str_conf = config_file.read().rstrip()
                configs[config_name].extend(
                    BuiltInFingerprintingRules.from_config_string(str_conf).rules
                )
        except InvalidFingerprintingConfig:
            logger.exception(
                "Fingerprinting Config %s Invalid",
                config_file_path,
            )
            if settings.DEBUG:
                raise
        except Exception:
            logger.exception(
                "Failed to load Fingerprinting Config %s",
                config_file_path,
            )
            if settings.DEBUG:
                raise

    return configs


FINGERPRINTING_BASES = _load_configs()
