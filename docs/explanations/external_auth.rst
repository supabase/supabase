.. _external_auth:

External Authentication
-----------------------

JWT from Auth0
~~~~~~~~~~~~~~

An external service like `Auth0 <https://auth0.com/>`_ can do the hard work transforming OAuth from Github, Twitter, Google etc into a JWT suitable for PostgREST. Auth0 can also handle email signup and password reset flows.

To use Auth0, create `an application <https://auth0.com/docs/get-started/applications>`_ for your app and `an API <https://auth0.com/docs/get-started/apis>`_ for your PostgREST server. Auth0 supports both HS256 and RS256 scheme for the issued tokens for APIs. For simplicity, you may first try HS256 scheme while creating your API on Auth0. Your application should use your PostgREST API's `API identifier <https://auth0.com/docs/get-started/apis/api-settings>`_ by setting it with the `audience parameter <https://auth0.com/docs/secure/tokens/access-tokens/get-access-tokens#control-access-token-audience>`_  during the authorization request. This will ensure that Auth0 will issue an access token for your PostgREST API. For PostgREST to verify the access token, you will need to set ``jwt-secret`` on PostgREST config file with your API's signing secret.
