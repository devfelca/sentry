from typing import List

from django.db.models import F
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.request import Request
from rest_framework.response import Response

from sentry import audit_log, features
from sentry.api.base import region_silo_endpoint
from sentry.api.bases.project import ProjectEndpoint
from sentry.api.serializers import serialize
from sentry.api.serializers.models.project_key import (
    ProjectKeySerializer,
    ProjectKeySerializerResponse,
)
from sentry.api.serializers.rest_framework import ProjectKeyRequestSerializer
from sentry.apidocs.constants import RESPONSE_BAD_REQUEST, RESPONSE_FORBIDDEN
from sentry.apidocs.examples.project_examples import ProjectExamples
from sentry.apidocs.parameters import CursorQueryParam, GlobalParams
from sentry.apidocs.utils import inline_sentry_response_serializer
from sentry.loader.dynamic_sdk_options import get_default_loader_data
from sentry.models import ProjectKey, ProjectKeyStatus


@extend_schema(tags=["Projects"])
@region_silo_endpoint
class ProjectKeysEndpoint(ProjectEndpoint):
    public = {"GET", "POST"}

    @extend_schema(
        operation_id="List a Project's Client Keys",
        parameters=[GlobalParams.ORG_SLUG, GlobalParams.PROJECT_SLUG, CursorQueryParam],
        request=inline_serializer(
            "ListClientKeys",
            fields={"status": serializers.ChoiceField(choices=["active", "inactive"])},
        ),
        responses={
            200: inline_sentry_response_serializer(
                "ListClientKeysResponse", List[ProjectKeySerializerResponse]
            ),
            400: RESPONSE_BAD_REQUEST,
            403: RESPONSE_FORBIDDEN,
        },
        examples=ProjectExamples.LIST_CLIENT_KEYS,
    )
    def get(self, request: Request, project) -> Response:
        """
        Return a list of client keys bound to a project.
        """
        queryset = ProjectKey.objects.filter(
            project=project, roles=F("roles").bitor(ProjectKey.roles.store)
        )
        status = request.GET.get("status")
        if status == "active":
            queryset = queryset.filter(status=ProjectKeyStatus.ACTIVE)
        elif status == "inactive":
            queryset = queryset.filter(status=ProjectKeyStatus.INACTIVE)
        elif status:
            queryset = queryset.none()

        return self.paginate(
            request=request,
            queryset=queryset,
            order_by="-id",
            on_results=lambda x: serialize(x, request.user),
        )

    @extend_schema(
        operation_id="Create a New Client Key",
        parameters=[
            GlobalParams.ORG_SLUG,
            GlobalParams.PROJECT_SLUG,
            GlobalParams.name(
                "The optional name of the key. If not provided a name will be automatically generated"
            ),
        ],
        request=None,
        responses={
            201: ProjectKeySerializer,
            400: RESPONSE_BAD_REQUEST,
            403: RESPONSE_FORBIDDEN,
        },
        examples=ProjectExamples.CREATE_CLIENT_KEY,
    )
    def post(self, request: Request, project) -> Response:
        """
        Create a new client key bound to a project.  The key's secret and public key
        are generated by the server.
        """
        serializer = ProjectKeyRequestSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        result = serializer.validated_data

        rate_limit_count = None
        rate_limit_window = None

        if features.has("projects:rate-limits", project):
            ratelimit = result.get("rateLimit", -1)
            if ratelimit != -1 and (ratelimit["count"] and ratelimit["window"]):
                rate_limit_count = result["rateLimit"]["count"]
                rate_limit_window = result["rateLimit"]["window"]

        key = ProjectKey.objects.create(
            project=project,
            label=result.get("name"),
            public_key=result.get("public"),
            secret_key=result.get("secret"),
            rate_limit_count=rate_limit_count,
            rate_limit_window=rate_limit_window,
            data=get_default_loader_data(project),
        )

        self.create_audit_entry(
            request=request,
            organization=project.organization,
            target_object=key.id,
            event=audit_log.get_event_id("PROJECTKEY_ADD"),
            data=key.get_audit_log_data(),
        )

        return Response(serialize(key, request.user), status=201)
