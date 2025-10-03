export const AUTH_ERROR_CODES = [
  { key: 'anonymous_provider_disabled', description: 'Anonymous sign-ins are disabled.' },
  {
    key: 'bad_code_verifier',
    description:
      'Returned from the PKCE flow where the provided code verifier does not match the expected one. Indicates a bug in the implementation of the client library.',
  },
  {
    key: 'bad_json',
    description: 'Usually used when the HTTP body of the request is not valid JSON.',
  },
  { key: 'bad_jwt', description: 'JWT sent in the Authorization header is not valid.' },
  {
    key: 'bad_oauth_callback',
    description:
      'OAuth callback from provider to Auth does not have all the required attributes (state). Indicates an issue with the OAuth provider or client library implementation.',
  },
  {
    key: 'bad_oauth_state',
    description:
      'OAuth state (data echoed back by the OAuth provider to Supabase Auth) is not in the correct format. Indicates an issue with the OAuth provider integration.',
  },
  {
    key: 'captcha_failed',
    description:
      'CAPTCHA challenge could not be verified with the CAPTCHA provider. Check your CAPTCHA integration.',
  },
  {
    key: 'conflict',
    description:
      'General database conflict, such as concurrent requests on resources that should not be modified concurrently. Can often occur when you have too many session refresh requests firing off at the same time for a user.',
  },
  {
    key: 'email_address_invalid',
    description:
      'Example and test domains are currently not supported. Use a different email address.',
  },
  {
    key: 'email_address_not_authorized',
    description:
      'Email sending is not allowed for this address as your project is using the default SMTP service. Set up a custom SMTP provider to send to external addresses.',
  },
  {
    key: 'email_conflict_identity_not_deletable',
    description:
      "Unlinking this identity causes the user's account to change to an email address which is already used by another user account.",
  },
  { key: 'email_exists', description: 'Email address already exists in the system.' },
  {
    key: 'email_not_confirmed',
    description: 'Signing in is not allowed for this user as the email address is not confirmed.',
  },
  { key: 'email_provider_disabled', description: 'Signups are disabled for email and password.' },
  {
    key: 'flow_state_expired',
    description:
      'PKCE flow state to which the API request relates has expired. Ask the user to sign in again.',
  },
  {
    key: 'flow_state_not_found',
    description:
      'PKCE flow state no longer exists or was destroyed by a previous request. Ask the user to sign in again.',
  },
  {
    key: 'hook_payload_invalid_content_type',
    description: 'Payload from Auth does not have a valid Content-Type header.',
  },
  {
    key: 'hook_payload_over_size_limit',
    description: 'Payload from Auth exceeds maximum size limit.',
  },
  { key: 'hook_timeout', description: 'Unable to reach hook within maximum time allocated.' },
  {
    key: 'hook_timeout_after_retry',
    description: 'Unable to reach hook after maximum number of retries.',
  },
  {
    key: 'identity_already_exists',
    description: 'The identity to which the API relates is already linked to a user.',
  },
  {
    key: 'identity_not_found',
    description:
      'Identity to which the API call relates does not exist, such as when an identity is unlinked or deleted.',
  },
  {
    key: 'insufficient_aal',
    description:
      'The user must have a higher Authenticator Assurance Level to call this API. Ask them to solve an MFA challenge.',
  },
  { key: 'invalid_credentials', description: 'Login credentials or grant type not recognized.' },
  { key: 'invite_not_found', description: 'Invite is expired or already used.' },
  {
    key: 'manual_linking_disabled',
    description:
      'Calling the supabase.auth.linkUser() and related APIs is not enabled on the Auth server.',
  },
  {
    key: 'mfa_challenge_expired',
    description: 'Responding to an MFA challenge took too long. Request a new challenge.',
  },
  {
    key: 'mfa_factor_name_conflict',
    description: 'MFA factors for a single user should not have the same friendly name.',
  },
  { key: 'mfa_factor_not_found', description: 'MFA factor no longer exists.' },
  {
    key: 'mfa_ip_address_mismatch',
    description:
      'The enrollment process for MFA factors must begin and end with the same IP address.',
  },
  {
    key: 'mfa_phone_enroll_not_enabled',
    description: 'Enrollment of MFA Phone factors is disabled.',
  },
  {
    key: 'mfa_phone_verify_not_enabled',
    description: 'Login via Phone factors and verification of new Phone factors is disabled.',
  },
  {
    key: 'mfa_totp_enroll_not_enabled',
    description: 'Enrollment of MFA TOTP factors is disabled.',
  },
  {
    key: 'mfa_totp_verify_not_enabled',
    description: 'Login via TOTP factors and verification of new TOTP factors is disabled.',
  },
  {
    key: 'mfa_verification_failed',
    description: 'MFA challenge could not be verified due to a wrong TOTP code.',
  },
  {
    key: 'mfa_verification_rejected',
    description: 'Further MFA verification is rejected due to a hook decision.',
  },
  {
    key: 'mfa_verified_factor_exists',
    description: 'Verified phone factor already exists for a user. Unenroll it to continue.',
  },
  {
    key: 'mfa_web_authn_enroll_not_enabled',
    description: 'Enrollment of MFA Web Authn factors is disabled.',
  },
  {
    key: 'mfa_web_authn_verify_not_enabled',
    description: 'Login via WebAuthn factors and verification of new WebAuthn factors is disabled.',
  },
  {
    key: 'no_authorization',
    description: 'This HTTP request requires an Authorization header, which is missing.',
  },
  { key: 'not_admin', description: 'User accessing the API is not admin.' },
  {
    key: 'oauth_provider_not_supported',
    description: 'Using an OAuth provider which is disabled on the Auth server.',
  },
  { key: 'otp_disabled', description: 'Sign in with OTPs (magic link, email OTP) is disabled.' },
  { key: 'otp_expired', description: 'OTP code has expired. Ask the user to sign in again.' },
  {
    key: 'over_email_send_rate_limit',
    description: 'Too many emails have been sent to this address. Ask the user to wait.',
  },
  {
    key: 'over_request_rate_limit',
    description:
      'Too many requests have been sent by this client. Ask the user to try again later.',
  },
  {
    key: 'over_sms_send_rate_limit',
    description: 'Too many SMS messages have been sent to this phone number. Ask the user to wait.',
  },
  { key: 'phone_exists', description: 'Phone number already exists in the system.' },
  {
    key: 'phone_not_confirmed',
    description: 'Signing in is not allowed for this user as the phone number is not confirmed.',
  },
  { key: 'phone_provider_disabled', description: 'Signups are disabled for phone and password.' },
  {
    key: 'provider_disabled',
    description: 'OAuth provider is disabled for use. Check configuration.',
  },
  {
    key: 'provider_email_needs_verification',
    description: 'OAuth provider does not verify emails. A verification email has been sent.',
  },
  {
    key: 'reauthentication_needed',
    description: 'A user must reauthenticate to change their password.',
  },
  {
    key: 'reauthentication_not_valid',
    description: 'Reauthentication failed. The code is incorrect.',
  },
  {
    key: 'refresh_token_already_used',
    description: 'Refresh token has been revoked and is outside the reuse interval.',
  },
  {
    key: 'refresh_token_not_found',
    description: 'Session containing the refresh token not found.',
  },
  {
    key: 'request_timeout',
    description: 'Processing the request took too long. Retry the request.',
  },
  {
    key: 'same_password',
    description: 'New password must be different from the current password.',
  },
  {
    key: 'saml_assertion_no_email',
    description: 'SAML assertion did not contain an email address.',
  },
  {
    key: 'saml_assertion_no_user_id',
    description: 'SAML assertion did not contain a required user ID (NameID).',
  },
  {
    key: 'saml_entity_id_mismatch',
    description:
      'Entity ID in SAML update does not match the database. Create a new provider instead.',
  },
  { key: 'saml_idp_already_exists', description: 'SAML identity provider already exists.' },
  { key: 'saml_idp_not_found', description: 'SAML identity provider not found.' },
  {
    key: 'saml_metadata_fetch_failed',
    description: 'Failed to fetch metadata from the provided URL for SAML provider.',
  },
  {
    key: 'saml_provider_disabled',
    description: 'Enterprise SSO with SAML 2.0 is not enabled on the Auth server.',
  },
  {
    key: 'saml_relay_state_expired',
    description: 'SAML relay state expired. Ask the user to sign in again.',
  },
  {
    key: 'saml_relay_state_not_found',
    description: 'SAML relay state no longer exists. Ask the user to sign in again.',
  },
  { key: 'session_expired', description: 'Session has expired due to inactivity or time limit.' },
  {
    key: 'session_not_found',
    description: 'Session no longer exists. Possibly deleted or user signed out.',
  },
  {
    key: 'signup_disabled',
    description: 'Sign ups (new account creation) are disabled on the server.',
  },
  {
    key: 'single_identity_not_deletable',
    description:
      'Every user must have at least one identity attached. Cannot delete the only identity.',
  },
  {
    key: 'sms_send_failed',
    description: 'Sending an SMS message failed. Check SMS provider configuration.',
  },
  {
    key: 'sso_domain_already_exists',
    description: 'Only one SSO domain can be registered per identity provider.',
  },
  {
    key: 'sso_provider_not_found',
    description: 'SSO provider not found. Check the signInWithSSO arguments.',
  },
  {
    key: 'too_many_enrolled_mfa_factors',
    description: 'A user can only have a limited number of enrolled MFA factors.',
  },
  {
    key: 'unexpected_audience',
    description: "The request's X-JWT-AUD claim does not match the JWT's audience.",
  },
  {
    key: 'unexpected_failure',
    description: 'Auth service is degraded or a bug occurred without a specific reason.',
  },
  {
    key: 'user_already_exists',
    description: 'User with this email or phone cannot be created again as it already exists.',
  },
  { key: 'user_banned', description: 'User is banned until the banned_until field is cleared.' },
  { key: 'user_not_found', description: 'User no longer exists.' },
  {
    key: 'user_sso_managed',
    description: 'Certain fields of an SSO user cannot be updated, like email.',
  },
  { key: 'validation_failed', description: 'Provided parameters are not in the expected format.' },
  { key: 'weak_password', description: 'Password does not meet the required strength criteria.' },
] as const
