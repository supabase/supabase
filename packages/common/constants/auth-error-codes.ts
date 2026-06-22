export const AUTH_ERROR_CODES = {
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
      'General database conflict, such as concurrent requests on resources that should not be modified concurrently. Can often occur when you have too many session refresh requests firing off at the same time for a user.',
  },
  email_address_invalid: {
    description:
      'Example and test domains are currently not supported. Use a different email address.',
  },
  email_address_not_authorized: {
    description:
      'Email sending is not allowed for this address as your project is using the default SMTP service. Set up a custom SMTP provider to send to external addresses.',
  },
  email_conflict_identity_not_deletable: {
    description:
      "Unlinking this identity causes the user's account to change to an email address which is already used by another user account.",
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
      'PKCE flow state no longer exists or was destroyed by a previous request. Ask the user to sign in again.',
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
      'The user must have a higher Authenticator Assurance Level to call this API. Ask them to solve an MFA challenge.',
  },
  invalid_credentials: {
    description: 'Login credentials or grant type not recognized.',
  },
  manual_linking_disabled: {
    description:
      'Calling the supabase.auth.linkUser() and related APIs is not enabled on the Auth server.',
  },
  mfa_challenge_expired: {
    description: 'Responding to an MFA challenge took too long. Request a new challenge.',
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
    description: 'MFA challenge could not be verified due to a wrong TOTP code.',
  },
  mfa_verification_rejected: {
    description: 'Further MFA verification is rejected due to a hook decision.',
  },
  mfa_verified_factor_exists: {
    description: 'Verified phone factor already exists for a user. Unenroll it to continue.',
  },
  mfa_web_authn_enroll_not_enabled: {
    description: 'Enrollment of MFA Web Authn factors is disabled.',
  },
  mfa_web_authn_verify_not_enabled: {
    description: 'Login via WebAuthn factors and verification of new WebAuthn factors is disabled.',
  },
  no_authorization: {
    description: 'This HTTP request requires an Authorization header, which is missing.',
  },
  oauth_provider_not_supported: {
    description: 'Using an OAuth provider which is disabled on the Auth server.',
  },
  otp_disabled: {
    description: 'Sign in with OTPs (magic link, email OTP) is disabled.',
  },
  otp_expired: {
    description: 'OTP code has expired. Ask the user to sign in again.',
  },
  over_email_send_rate_limit: {
    description: 'Too many emails have been sent to this address. Ask the user to wait.',
  },
  over_request_rate_limit: {
    description:
      'Too many requests have been sent by this client. Ask the user to try again later.',
  },
  over_sms_send_rate_limit: {
    description: 'Too many SMS messages have been sent to this phone number. Ask the user to wait.',
  },
  phone_not_confirmed: {
    description: 'Signing in is not allowed for this user as the phone number is not confirmed.',
  },
  phone_provider_disabled: {
    description: 'Signups are disabled for phone and password.',
  },
  provider_disabled: {
    description: 'OAuth provider is disabled for use. Check configuration.',
  },
  provider_email_needs_verification: {
    description: 'OAuth provider does not verify emails. A verification email has been sent.',
  },
  reauthentication_needed: {
    description: 'A user must reauthenticate to change their password.',
  },
  reauthentication_not_valid: {
    description: 'Reauthentication failed. The code is incorrect.',
  },
  refresh_token_already_used: {
    description: 'Refresh token has been revoked and is outside the reuse interval.',
  },
  refresh_token_not_found: {
    description: 'Session containing the refresh token not found.',
  },
  request_timeout: {
    description: 'Processing the request took too long. Retry the request.',
  },
  same_password: {
    description: 'New password must be different from the current password.',
  },
  saml_assertion_no_email: {
    description: 'SAML assertion did not contain an email address.',
  },
  saml_assertion_no_user_id: {
    description: 'SAML assertion did not contain a required user ID (NameID).',
  },
  saml_entity_id_mismatch: {
    description:
      'Entity ID in SAML update does not match the database. Create a new provider instead.',
  },
  saml_idp_already_exists: {
    description: 'SAML identity provider already exists.',
  },
  saml_idp_not_found: {
    description: 'SAML identity provider not found.',
  },
  saml_metadata_fetch_failed: {
    description: 'Failed to fetch metadata from the provided URL for SAML provider.',
  },
  saml_provider_disabled: {
    description: 'Enterprise SSO with SAML 2.0 is not enabled on the Auth server.',
  },
  saml_relay_state_expired: {
    description: 'SAML relay state expired. Ask the user to sign in again.',
  },
  saml_relay_state_not_found: {
    description: 'SAML relay state no longer exists. Ask the user to sign in again.',
  },
  session_expired: {
    description: 'Session has expired due to inactivity or time limit.',
  },
  session_not_found: {
    description: 'Session no longer exists. Possibly deleted or user signed out.',
  },
  signup_disabled: {
    description: 'Sign ups (new account creation) are disabled on the server.',
  },
  single_identity_not_deletable: {
    description:
      'Every user must have at least one identity attached. Cannot delete the only identity.',
  },
  sms_send_failed: {
    description: 'Sending an SMS message failed. Check SMS provider configuration.',
  },
  sso_domain_already_exists: {
    description: 'Only one SSO domain can be registered per identity provider.',
  },
  sso_provider_not_found: {
    description: 'SSO provider not found. Check the signInWithSSO arguments.',
  },
  too_many_enrolled_mfa_factors: {
    description: 'A user can only have a limited number of enrolled MFA factors.',
  },
  unexpected_audience: {
    description: "The request's X-JWT-AUD claim does not match the JWT's audience.",
  },
  unexpected_failure: {
    description: 'Auth service is degraded or a bug occurred without a specific reason.',
  },
  user_already_exists: {
    description: 'User with this email or phone cannot be created again as it already exists.',
  },
  user_banned: {
    description: 'User is banned until the banned_until field is cleared.',
  },
  user_sso_managed: {
    description: 'Certain fields of an SSO user cannot be updated, like email.',
  },
  validation_failed: {
    description: 'Provided parameters are not in the expected format.',
  },
  weak_password: {
    description: 'Password does not meet the required strength criteria.',
  },
}
