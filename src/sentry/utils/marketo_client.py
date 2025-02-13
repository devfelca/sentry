from typing import TypedDict

from django.conf import settings

from sentry import http


def marketo_option(field):
    return settings.MARKETO[field]


class ErrorDict(TypedDict):
    code: str
    message: str


class MarketoErrorResponse(TypedDict):
    errors: list[ErrorDict]


class MarketoError(Exception):
    def __init__(self, data: MarketoErrorResponse):
        # just use the first error
        error = data["errors"][0]
        self.code = error["code"]
        self.message = error["message"]

    def __str__(self):
        return f"MarketoError: {self.code} - {self.message}"


class MarketoClient:
    OAUTH_URL = "/identity/oauth/token"
    SUBMIT_FORM_URL = "/rest/v1/leads/submitForm.json"

    def make_request(self, url: str, *args, method="GET", **kwargs):
        base_url = marketo_option("base-url")
        full_url = base_url + url
        method = kwargs.pop("method", "GET")
        session = http.build_session()
        resp = getattr(session, method.lower())(full_url, *args, **kwargs)
        resp.raise_for_status()
        return resp.json()

    def make_rest_request(self, url: str, *args, headers=None, **kwargs):
        if headers is None:
            headers = {}
        headers["Authorization"] = f"Bearer {self.token}"
        headers["Content-Type"] = "application/json"
        data = self.make_request(url, *args, headers=headers, **kwargs)

        if not data.get("success"):
            raise MarketoError(data)

        # not handling field level errors where success=True

        return data

    def retrieve_token(self):
        client_id = marketo_option("client-id")
        clint_secret = marketo_option("client-secret")

        url = f"{self.OAUTH_URL}?grant_type=client_credentials&client_id={client_id}&client_secret={clint_secret}"
        return self.make_request(url)

    def submit_form(self, fields):
        body = {
            "formId": marketo_option("form-id"),
            "input": [
                {
                    "leadFormFields": fields,
                }
            ],
        }

        return self.make_rest_request(self.SUBMIT_FORM_URL, method="POST", json=body)

    @property
    def token(self):
        resp = self.retrieve_token()
        return resp["access_token"]
