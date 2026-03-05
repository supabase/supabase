export const HOOKS_DEFINITIONS = [
  {
    id: 'send-sms',
    title: 'Send SMS hook',
    subtitle: 'Will be called by Supabase Auth each time an SMS message needs to be sent.',
    entitlementKey: 'HOOK_SEND_SMS',
    enabledKey: 'HOOK_SEND_SMS_ENABLED',
    uriKey: 'HOOK_SEND_SMS_URI',
    secretsKey: 'HOOK_SEND_SMS_SECRETS',
    docSlug: 'send-sms-hook',
  },
  {
    id: 'send-email',
    title: 'Send Email hook',
    subtitle: 'Will be called by Supabase Auth each time an email message needs to be sent.',
    entitlementKey: 'HOOK_SEND_EMAIL',
    enabledKey: 'HOOK_SEND_EMAIL_ENABLED',
    uriKey: 'HOOK_SEND_EMAIL_URI',
    secretsKey: 'HOOK_SEND_EMAIL_SECRETS',
    docSlug: 'send-email-hook',
  },
  {
    id: 'custom-access-token-claims',
    title: 'Customize Access Token (JWT) Claims hook',
    subtitle:
      'Will be called by Supabase Auth each time a new JWT is created. It should return the claims you wish to be present in the JWT.',
    entitlementKey: 'HOOK_CUSTOM_ACCESS_TOKEN',
    enabledKey: 'HOOK_CUSTOM_ACCESS_TOKEN_ENABLED',
    uriKey: 'HOOK_CUSTOM_ACCESS_TOKEN_URI',
    secretsKey: 'HOOK_CUSTOM_ACCESS_TOKEN_SECRETS',
    docSlug: 'custom-access-token-hook',
  },
  {
    id: 'mfa-verification-attempt',
    title: 'MFA Verification Attempt hook',
    subtitle:
      'Will be called by Supabase Auth each time a user tries to verify an MFA factor. Return a decision on whether to reject the attempt and future ones, or to allow the user to keep trying.',
    entitlementKey: 'HOOK_MFA_VERIFICATION_ATTEMPT',
    enabledKey: 'HOOK_MFA_VERIFICATION_ATTEMPT_ENABLED',
    uriKey: 'HOOK_MFA_VERIFICATION_ATTEMPT_URI',
    secretsKey: 'HOOK_MFA_VERIFICATION_ATTEMPT_SECRETS',
    docSlug: 'mfa-verification-hook',
  },
  {
    id: 'password-verification-attempt',
    title: 'Password Verification Attempt hook',
    subtitle:
      'Will be called by Supabase Auth each time a user tries to sign in with a password. Return a decision whether to allow the user to reject the attempt, or to allow the user to keep trying.',
    entitlementKey: 'HOOK_PASSWORD_VERIFICATION_ATTEMPT',
    enabledKey: 'HOOK_PASSWORD_VERIFICATION_ATTEMPT_ENABLED',
    uriKey: 'HOOK_PASSWORD_VERIFICATION_ATTEMPT_URI',
    secretsKey: 'HOOK_PASSWORD_VERIFICATION_ATTEMPT_SECRETS',
    docSlug: 'password-verification-hook',
  },
  {
    id: 'before-user-created',
    title: 'Before User Created hook',
    subtitle:
      'Will be called by Supabase Auth before creating a new user. Returning an error will prevent the user from being created.',
    entitlementKey: 'HOOK_BEFORE_USER_CREATED',
    enabledKey: 'HOOK_BEFORE_USER_CREATED_ENABLED',
    uriKey: 'HOOK_BEFORE_USER_CREATED_URI',
    secretsKey: 'HOOK_BEFORE_USER_CREATED_SECRETS',
    docSlug: 'before-user-created-hook',
  },
] as const

export type HOOK_DEFINITION_TITLE = (typeof HOOKS_DEFINITIONS)[number]['title']

export interface Hook {
  id: string
  title: HOOK_DEFINITION_TITLE
  subtitle: string
  entitlementKey: string
  enabled: boolean
  enabledKey: string
  uriKey: string
  secretsKey: string
  docSlug: string
  method:
    | { type: 'postgres'; schema: string; functionName: string }
    | { type: 'https'; url: string; secret: string }
}
