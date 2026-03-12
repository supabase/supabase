export interface ErrorCodeDefinition {
  description: string
  resolution?: string
  references?: Array<{ href: string; description: string }>
}

export type ErrorCodeService = 'auth' | 'realtime'

export const ERROR_CODE_DOCS_URLS: Record<ErrorCodeService, string> = {
  auth: 'https://supabase.com/docs/guides/auth/debugging/error-codes',
  realtime: 'https://supabase.com/docs/guides/realtime/reports',
}

export const HTTP_ERROR_CODES: Partial<
  Record<ErrorCodeService, Record<number, { description: string }>>
> = {
  auth: {
    403: {
      description:
        'Sent out in rare situations where a certain Auth feature is not available for the user, and you as the developer are not checking a precondition whether that API is available for the user.',
    },
    422: {
      description:
        'Sent out when the API request is accepted, but cannot be processed because the user or Auth server is in a state where it cannot satisfy the request.',
    },
    429: {
      description:
        'Sent out when rate-limits are breached for an API. You should handle this status code often, especially in functions that authenticate a user.',
    },
    500: {
      description:
        "Indicates that the Auth server's service is degraded. Most often it points to issues in your database setup such as a misbehaving trigger on a schema, function, view or other database object.",
    },
    501: {
      description:
        'Sent out when a feature is not enabled on the Auth server, and you are trying to use an API which requires it.',
    },
  },
}

export const ERROR_CODES: Record<ErrorCodeService, Record<string, ErrorCodeDefinition>> = {
  auth: {
    anonymous_provider_disabled: {
      description: 'Anonymous sign-ins are disabled.',
    },
    bad_code_verifier: {
      description:
        'Returned from the PKCE flow where the provided code verifier does not match the expected one. Indicates a bug in the implementation of the client library.',
    },
    bad_json: {
      description: 'Usually used when the HTTP body of the request is not valid JSON.',
    },
    bad_jwt: {
      description: 'JWT sent in the Authorization header is not valid.',
    },
    bad_oauth_callback: {
      description:
        'OAuth callback from provider to Auth does not have all the required attributes (state). Indicates an issue with the OAuth provider or client library implementation.',
    },
    bad_oauth_state: {
      description:
        'OAuth state (data echoed back by the OAuth provider to Supabase Auth) is not in the correct format. Indicates an issue with the OAuth provider integration.',
    },
    captcha_failed: {
      description:
        'CAPTCHA challenge could not be verified with the CAPTCHA provider. Check your CAPTCHA integration.',
    },
    conflict: {
      description:
        'General database conflict, such as concurrent requests on resources that should not be modified concurrently. Can often occur when you have too many session refresh requests firing off at the same time for a user. Check your app for concurrency issues, and if detected, back off exponentially.',
    },
    email_address_invalid: {
      description:
        'Example and test domains are currently not supported. Use a different email address.',
    },
    email_address_not_authorized: {
      description:
        'Email sending is not allowed for this address as your project is using the default SMTP service. Emails can only be sent to members in your Supabase organization. If you want to send emails to others, set up a custom SMTP provider.',
      references: [
        {
          href: 'https://supabase.com/docs/guides/auth/auth-smtp',
          description: 'Setting up a custom SMTP provider',
        },
      ],
    },
    email_conflict_identity_not_deletable: {
      description:
        "Unlinking this identity causes the user's account to change to an email address which is already used by another user account. Indicates an issue where the user has two different accounts using different primary email addresses. You may need to migrate user data to one of their accounts in this case.",
    },
    email_exists: {
      description: 'Email address already exists in the system.',
    },
    email_not_confirmed: {
      description: 'Signing in is not allowed for this user as the email address is not confirmed.',
    },
    email_provider_disabled: {
      description: 'Signups are disabled for email and password.',
    },
    flow_state_expired: {
      description:
        'PKCE flow state to which the API request relates has expired. Ask the user to sign in again.',
    },
    flow_state_not_found: {
      description:
        'PKCE flow state to which the API request relates no longer exists. Flow states expire after a while and are progressively cleaned up, which can cause this error. Retried requests can cause this error, as the previous request likely destroyed the flow state. Ask the user to sign in again.',
    },
    hook_payload_invalid_content_type: {
      description: 'Payload from Auth does not have a valid Content-Type header.',
    },
    hook_payload_over_size_limit: {
      description: 'Payload from Auth exceeds maximum size limit.',
    },
    hook_timeout: {
      description: 'Unable to reach hook within maximum time allocated.',
    },
    hook_timeout_after_retry: {
      description: 'Unable to reach hook after maximum number of retries.',
    },
    identity_already_exists: {
      description: 'The identity to which the API relates is already linked to a user.',
    },
    identity_not_found: {
      description:
        'Identity to which the API call relates does not exist, such as when an identity is unlinked or deleted.',
    },
    insufficient_aal: {
      description:
        'To call this API, the user must have a higher Authenticator Assurance Level. To resolve, ask the user to solve an MFA challenge.',
      references: [
        {
          href: 'https://supabase.com/docs/guides/auth/auth-mfa',
          description: 'MFA',
        },
      ],
    },
    invite_not_found: {
      description: 'Invite is expired or already used.',
    },
    invalid_credentials: {
      description: 'Login credentials or grant type not recognized.',
    },
    manual_linking_disabled: {
      description:
        'Calling the supabase.auth.linkUser() and related APIs is not enabled on the Auth server.',
    },
    mfa_challenge_expired: {
      description:
        'Responding to an MFA challenge should happen within a fixed time period. Request a new challenge when encountering this error.',
    },
    mfa_factor_name_conflict: {
      description: 'MFA factors for a single user should not have the same friendly name.',
    },
    mfa_factor_not_found: {
      description: 'MFA factor no longer exists.',
    },
    mfa_ip_address_mismatch: {
      description:
        'The enrollment process for MFA factors must begin and end with the same IP address.',
    },
    mfa_phone_enroll_not_enabled: {
      description: 'Enrollment of MFA Phone factors is disabled.',
    },
    mfa_phone_verify_not_enabled: {
      description: 'Login via Phone factors and verification of new Phone factors is disabled.',
    },
    mfa_totp_enroll_not_enabled: {
      description: 'Enrollment of MFA TOTP factors is disabled.',
    },
    mfa_totp_verify_not_enabled: {
      description: 'Login via TOTP factors and verification of new TOTP factors is disabled.',
    },
    mfa_verification_failed: {
      description: 'MFA challenge could not be verified -- wrong TOTP code.',
    },
    mfa_verification_rejected: {
      description:
        'Further MFA verification is rejected. Only returned if the MFA verification attempt hook returns a reject decision.',
      references: [
        {
          href: 'https://supabase.com/docs/guides/auth/auth-hooks?language=add-admin-role#hook-mfa-verification-attempt',
          description: 'MFA verification hook',
        },
      ],
    },
    mfa_verified_factor_exists: {
      description:
        'Verified phone factor already exists for a user. Unenroll existing verified phone factor to continue.',
    },
    mfa_web_authn_enroll_not_enabled: {
      description: 'Enrollment of MFA Web Authn factors is disabled.',
    },
    mfa_web_authn_verify_not_enabled: {
      description:
        'Login via WebAuthn factors and verification of new WebAuthn factors is disabled.',
    },
    no_authorization: {
      description: 'This HTTP request requires an Authorization header, which is not provided.',
    },
    not_admin: {
      description:
        'User accessing the API is not admin, i.e. the JWT does not contain a role claim that identifies them as an admin of the Auth server.',
    },
    oauth_provider_not_supported: {
      description: 'Using an OAuth provider which is disabled on the Auth server.',
    },
    otp_disabled: {
      description:
        "Sign in with OTPs (magic link, email OTP) is disabled. Check your server's configuration.",
    },
    otp_expired: {
      description: 'OTP code for this sign-in has expired. Ask the user to sign in again.',
    },
    over_email_send_rate_limit: {
      description:
        'Too many emails have been sent to this email address. Ask the user to wait a while before trying again.',
    },
    over_request_rate_limit: {
      description:
        'Too many requests have been sent by this client (IP address). Ask the user to try again in a few minutes. Sometimes can indicate a bug in your application that mistakenly sends out too many requests (such as a badly written useEffect React hook).',
      references: [
        {
          href: 'https://react.dev/reference/react/useEffect',
          description: 'React useEffect hook',
        },
      ],
    },
    over_sms_send_rate_limit: {
      description:
        'Too many SMS messages have been sent to this phone number. Ask the user to wait a while before trying again.',
    },
    phone_exists: {
      description: 'Phone number already exists in the system.',
    },
    phone_not_confirmed: {
      description: 'Signing in is not allowed for this user as the phone number is not confirmed.',
    },
    phone_provider_disabled: {
      description: 'Signups are disabled for phone and password.',
    },
    provider_disabled: {
      description: "OAuth provider is disabled for use. Check your server's configuration.",
    },
    provider_email_needs_verification: {
      description:
        "Not all OAuth providers verify their user's email address. Supabase Auth requires emails to be verified, so this error is sent out when a verification email is sent after completing the OAuth flow.",
    },
    reauthentication_needed: {
      description:
        'A user needs to reauthenticate to change their password. Ask the user to reauthenticate by calling the supabase.auth.reauthenticate() API.',
    },
    reauthentication_not_valid: {
      description:
        'Verifying a reauthentication failed, the code is incorrect. Ask the user to enter a new code.',
    },
    refresh_token_not_found: {
      description: 'Session containing the refresh token not found.',
    },
    refresh_token_already_used: {
      description:
        'Refresh token has been revoked and falls outside the refresh token reuse interval. See the documentation on sessions for further information.',
      references: [
        {
          href: 'https://supabase.com/docs/guides/auth/sessions',
          description: 'Auth sessions',
        },
      ],
    },
    request_timeout: {
      description: 'Processing the request took too long. Retry the request.',
    },
    same_password: {
      description:
        'A user that is updating their password must use a different password than the one currently used.',
    },
    saml_assertion_no_email: {
      description:
        "SAML assertion (user information) was received after sign in, but no email address was found in it, which is required. Check the provider's attribute mapping and/or configuration.",
    },
    saml_assertion_no_user_id: {
      description:
        "SAML assertion (user information) was received after sign in, but a user ID (called NameID) was not found in it, which is required. Check the SAML identity provider's configuration.",
    },
    saml_entity_id_mismatch: {
      description:
        '(Admin API.) Updating the SAML metadata for a SAML identity provider is not possible, as the entity ID in the update does not match the entity ID in the database. This is equivalent to creating a new identity provider, and you should do that instead.',
    },
    saml_idp_already_exists: {
      description: '(Admin API.) Adding a SAML identity provider that is already added.',
    },
    saml_idp_not_found: {
      description:
        'SAML identity provider not found. Most often returned after IdP-initiated sign-in with an unregistered SAML identity provider in Supabase Auth.',
    },
    saml_metadata_fetch_failed: {
      description:
        '(Admin API.) Adding or updating a SAML provider failed as its metadata could not be fetched from the provided URL.',
    },
    saml_provider_disabled: {
      description: 'Using Enterprise SSO with SAML 2.0 is not enabled on the Auth server.',
      references: [
        {
          href: 'https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml',
          description: 'Enterprise SSO',
        },
      ],
    },
    saml_relay_state_expired: {
      description:
        'SAML relay state is an object that tracks the progress of a supabase.auth.signInWithSSO() request. The SAML identity provider should respond after a fixed amount of time, after which this error is shown. Ask the user to sign in again.',
    },
    saml_relay_state_not_found: {
      description:
        'SAML relay states are progressively cleaned up after they expire, which can cause this error. Ask the user to sign in again.',
    },
    session_expired: {
      description:
        'Session to which the API request relates has expired. This can occur if an inactivity timeout is configured, or the session entry has exceeded the configured timebox value. See the documentation on sessions for more information.',
      references: [
        {
          href: 'https://supabase.com/docs/guides/auth/sessions',
          description: 'Auth sessions',
        },
      ],
    },
    session_not_found: {
      description:
        'Session to which the API request relates no longer exists. This can occur if the user has signed out, or the session entry in the database was deleted in some other way.',
    },
    signup_disabled: {
      description: 'Sign ups (new account creation) are disabled on the server.',
    },
    single_identity_not_deletable: {
      description:
        "Every user must have at least one identity attached to it, so deleting (unlinking) an identity is not allowed if it's the only one for the user.",
    },
    sms_send_failed: {
      description: 'Sending an SMS message failed. Check your SMS provider configuration.',
    },
    sso_domain_already_exists: {
      description: '(Admin API.) Only one SSO domain can be registered per SSO identity provider.',
    },
    sso_provider_not_found: {
      description: 'SSO provider not found. Check the arguments in supabase.auth.signInWithSSO().',
    },
    too_many_enrolled_mfa_factors: {
      description: 'A user can only have a fixed number of enrolled MFA factors.',
    },
    unexpected_audience: {
      description:
        "(Deprecated feature not available via Supabase client libraries.) The request's X-JWT-AUD claim does not match the JWT's audience.",
    },
    unexpected_failure: {
      description: 'Auth service is degraded or a bug is present, without a specific reason.',
    },
    user_already_exists: {
      description:
        'User with this information (email address, phone number) cannot be created again as it already exists.',
    },
    user_banned: {
      description:
        'User to which the API request relates has a banned_until property which is still active. No further API requests should be attempted until this field is cleared.',
    },
    user_not_found: {
      description: 'User to which the API request relates no longer exists.',
    },
    user_sso_managed: {
      description:
        'When a user comes from SSO, certain fields of the user cannot be updated (like email).',
    },
    validation_failed: {
      description: 'Provided parameters are not in the expected format.',
    },
    weak_password: {
      description:
        'User is signing up or changing their password without meeting the password strength criteria. Use the AuthWeakPasswordError class to access more information about what they need to do to make the password pass.',
    },
  },
  realtime: {
    TopicNameRequired: {
      description: 'You are trying to use Realtime without a topic name set.',
    },
    RealtimeDisabledForConfiguration: {
      description:
        'The configuration provided to Realtime on connect will not be able to provide you any Postgres Changes.',
      resolution:
        'Verify your configuration on channel startup as you might not have your tables properly registered.',
    },
    TenantNotFound: {
      description: 'The tenant you are trying to connect to does not exist.',
      resolution:
        'Verify the tenant name you are trying to connect to exists in the realtime.tenants table.',
    },
    ErrorConnectingToWebsocket: {
      description: 'Error when trying to connect to the WebSocket server.',
      resolution: 'Verify user information on connect.',
    },
    ErrorAuthorizingWebsocket: {
      description: 'Error when trying to authorize the WebSocket connection.',
      resolution: 'Verify user information on connect.',
    },
    TableHasSpacesInName: {
      description:
        'The table you are trying to listen to has spaces in its name which we are unable to support.',
      resolution: 'Change the table name to not have spaces in it.',
    },
    UnableToDeleteTenant: {
      description: 'Error when trying to delete a tenant.',
    },
    UnableToSetPolicies: {
      description: 'Error when setting up Authorization Policies.',
    },
    UnableCheckoutConnection: {
      description: 'Error when trying to checkout a connection from the tenant pool.',
    },
    UnableToSubscribeToPostgres: {
      description: 'Error when trying to subscribe to Postgres changes.',
    },
    ReconnectSubscribeToPostgres: {
      description: 'Postgres changes still waiting to be subscribed.',
    },
    ChannelRateLimitReached: {
      description: 'The number of channels you can create has reached its limit.',
    },
    ConnectionRateLimitReached: {
      description: 'The number of connected clients has reached its limit.',
    },
    ClientJoinRateLimitReached: {
      description: 'The rate of joins per second from your clients has reached the channel limits.',
    },
    RealtimeDisabledForTenant: {
      description: 'Realtime has been disabled for the tenant.',
      resolution:
        'Your project may have been suspended for exceeding usage quotas. Contact support with your project reference ID and a description of your Realtime use case.',
      references: [
        {
          href: 'https://supabase.com/docs/troubleshooting/realtime-project-suspended-for-exceeding-quotas',
          description: 'Troubleshooting guide for suspended projects',
        },
      ],
    },
    UnableToConnectToTenantDatabase: {
      description: "Realtime was not able to connect to the tenant's database.",
    },
    DatabaseLackOfConnections: {
      description:
        "Realtime was not able to connect to the tenant's database due to not having enough available connections.",
      resolution: 'Verify your database connection limits.',
      references: [
        {
          href: 'https://supabase.com/docs/guides/database/connection-management',
          description: 'Connection management guide',
        },
      ],
    },
    RealtimeNodeDisconnected: {
      description:
        'Realtime is a distributed application and this means that one the system is unable to communicate with one of the distributed nodes.',
    },
    MigrationsFailedToRun: {
      description:
        'Error when running the migrations against the Tenant database that are required by Realtime.',
    },
    StartListenAndReplicationFailed: {
      description:
        'Error when starting the replication and listening of errors for database broadcasting.',
    },
    ReplicationMaxWalSendersReached: {
      description: 'Maximum number of WAL senders reached in tenant database.',
      references: [
        {
          href: 'https://supabase.com/docs/guides/database/custom-postgres-config#cli-configurable-settings',
          description: 'Configuring max WAL senders',
        },
      ],
    },
    MigrationCheckFailed: {
      description: 'Check to see if we require to run migrations fails.',
    },
    PartitionCreationFailed: {
      description: 'Error when creating partitions for realtime.messages.',
    },
    ErrorStartingPostgresCDCStream: {
      description:
        'Error when starting the Postgres CDC stream which is used for Postgres Changes.',
    },
    UnknownDataProcessed: {
      description: 'An unknown data type was processed by the Realtime system.',
    },
    ErrorStartingPostgresCDC: {
      description:
        'Error when starting the Postgres CDC extension which is used for Postgres Changes.',
    },
    ReplicationSlotBeingUsed: {
      description: 'The replication slot is being used by another transaction.',
    },
    PoolingReplicationPreparationError: {
      description: 'Error when preparing the replication slot.',
    },
    PoolingReplicationError: {
      description: 'Error when pooling the replication slot.',
    },
    SubscriptionDeletionFailed: {
      description: 'Error when trying to delete a subscription for postgres changes.',
    },
    UnableToDeletePhantomSubscriptions: {
      description: 'Error when trying to delete subscriptions that are no longer being used.',
    },
    UnableToCheckProcessesOnRemoteNode: {
      description: 'Error when trying to check the processes on a remote node.',
    },
    UnableToCreateCounter: {
      description: 'Error when trying to create a counter to track rate limits for a tenant.',
    },
    UnableToIncrementCounter: {
      description: 'Error when trying to increment a counter to track rate limits for a tenant.',
    },
    UnableToDecrementCounter: {
      description: 'Error when trying to decrement a counter to track rate limits for a tenant.',
    },
    UnableToUpdateCounter: {
      description: 'Error when trying to update a counter to track rate limits for a tenant.',
    },
    UnableToFindCounter: {
      description: 'Error when trying to find a counter to track rate limits for a tenant.',
    },
    UnhandledProcessMessage: {
      description: 'Unhandled message received by a Realtime process.',
    },
    UnableToTrackPresence: {
      description: 'Error when handling track presence for this socket.',
    },
    UnknownPresenceEvent: {
      description: 'Presence event type not recognized by service.',
    },
    IncreaseConnectionPool: {
      description:
        'The number of connections you have set for Realtime are not enough to handle your current use case.',
    },
    RlsPolicyError: {
      description: 'Error on RLS policy used for authorization.',
    },
    ConnectionInitializing: {
      description: 'Database is initializing connection.',
    },
    DatabaseConnectionIssue: {
      description: 'Database had connection issues and connection was not able to be established.',
    },
    UnableToConnectToProject: {
      description: 'Unable to connect to Project database.',
    },
    InvalidJWTExpiration: {
      description: "JWT exp claim value it's incorrect.",
    },
    JwtSignatureError: {
      description: 'JWT signature was not able to be validated.',
    },
    MalformedJWT: {
      description: 'Token received does not comply with the JWT format.',
    },
    Unauthorized: {
      description: 'Unauthorized access to Realtime channel.',
    },
    RealtimeRestarting: {
      description: 'Realtime is currently restarting.',
    },
    UnableToProcessListenPayload: {
      description: 'Payload sent in NOTIFY operation was "NOT" JSON parsable.',
    },
    UnableToListenToTenantDatabase: {
      description: 'Unable to LISTEN for notifications against the Tenant Database.',
    },
    UnprocessableEntity: {
      description:
        'Received a HTTP request with a body that was not able to be processed by the endpoint.',
    },
    InitializingProjectConnection: {
      description: 'Connection against Tenant database is still starting.',
    },
    TimeoutOnRpcCall: {
      description: 'RPC request within the Realtime server has timed out.',
    },
    ErrorOnRpcCall: {
      description: 'Error when calling another realtime node.',
    },
    ErrorExecutingTransaction: {
      description: 'Error executing a database transaction in tenant database.',
    },
    SynInitializationError: {
      description:
        'Our framework to syncronize processes has failed to properly startup a connection to the database.',
    },
    JanitorFailedToDeleteOldMessages: {
      description: 'Scheduled task for realtime.message cleanup was unable to run.',
    },
    UnableToEncodeJson: {
      description:
        'An error were we are not handling correctly the response to be sent to the end user.',
    },
    UnknownErrorOnController: {
      description: 'An error we are not handling correctly was triggered on a controller.',
    },
    UnknownErrorOnChannel: {
      description: 'An error we are not handling correctly was triggered on a channel.',
    },
  },
}
