import { z } from 'zod'

// Field labels mapping for form generation
export const authFieldLabels: Record<
  string,
  string | { label: string; options?: Record<string, string> }
> = {
  // General Settings
  disable_signup: 'Disable Signup',
  external_anonymous_users_enabled: 'Allow Anonymous Sign-ins',

  // Email Provider
  external_email_enabled: 'Enable Email Provider',
  mailer_autoconfirm: 'Confirm Email',
  mailer_secure_email_change_enabled: 'Secure Email Change',
  security_update_password_require_reauthentication: 'Secure Password Change',
  password_hibp_enabled: 'Prevent Leaked Passwords',
  password_min_length: 'Minimum Password Length',
  password_required_characters: {
    label: 'Password Requirements',
    options: {
      NO_REQUIRED_CHARS: 'No requirements',
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ:0123456789': 'Letters and numbers',
      'abcdefghijklmnopqrstuvwxyz:ABCDEFGHIJKLMNOPQRSTUVWXYZ:0123456789':
        'Lowercase, uppercase, and numbers',
      'abcdefghijklmnopqrstuvwxyz:ABCDEFGHIJKLMNOPQRSTUVWXYZ:0123456789:!@#$%^&*()_+-=[]{};\'\\\\:"|<>?,./`~':
        'Letters, numbers, and symbols',
    },
  },
  mailer_otp_exp: 'Email OTP Expiration (seconds)',
  mailer_otp_length: 'Email OTP Length',

  // Phone Provider
  external_phone_enabled: 'Enable Phone Provider',
  sms_provider: {
    label: 'SMS Provider',
    options: {
      twilio: 'Twilio',
      messagebird: 'MessageBird',
      textlocal: 'TextLocal',
      vonage: 'Vonage',
      twilio_verify: 'Twilio Verify',
    },
  },
  sms_twilio_account_sid: 'Twilio Account SID',
  sms_twilio_auth_token: 'Twilio Auth Token',
  sms_twilio_message_service_sid: 'Twilio Message Service SID',
  sms_twilio_content_sid: 'Twilio Content SID',
  sms_twilio_verify_account_sid: 'Twilio Verify Account SID',
  sms_twilio_verify_auth_token: 'Twilio Verify Auth Token',
  sms_twilio_verify_message_service_sid: 'Twilio Verify Message Service SID',
  sms_messagebird_access_key: 'MessageBird Access Key',
  sms_messagebird_originator: 'MessageBird Originator',
  sms_textlocal_api_key: 'TextLocal API Key',
  sms_textlocal_sender: 'TextLocal Sender',
  sms_vonage_api_key: 'Vonage API Key',
  sms_vonage_api_secret: 'Vonage API Secret',
  sms_vonage_from: 'Vonage From Number',
  sms_autoconfirm: 'Enable Phone Confirmations',
  sms_otp_exp: 'SMS OTP Expiry (seconds)',
  sms_otp_length: 'SMS OTP Length',
  sms_template: 'SMS Message Template',
  sms_test_otp: 'Test Phone Numbers and OTPs',
  sms_test_otp_valid_until: 'Test OTPs Valid Until',

  // Google Provider
  external_google_enabled: 'Enable Google Sign-in',
  external_google_client_id: 'Google Client ID(s)',
  external_google_secret: 'Google OAuth Client Secret',
  external_google_skip_nonce_check: 'Skip Nonce Check',

  // Secrets
  name: 'Secret Name',
  value: 'Secret Value',
  secretNames: 'Secret Names',
}

// New schemas for auth settings

export const authGeneralSettingsSchema = z.object({
  disable_signup: z.boolean().optional().describe('This will prevent new users from signing up.'),
  external_anonymous_users_enabled: z
    .boolean()
    .optional()
    .describe('This will enable anonymous users to sign in to your application.'),
})
export type AuthGeneralSettingsSchema = z.infer<typeof authGeneralSettingsSchema>

const NO_REQUIRED_CHARACTERS = 'NO_REQUIRED_CHARS'

export const authEmailProviderSchema = z
  .object({
    external_email_enabled: z
      .boolean()
      .optional()
      .describe('This will enable Email based signup and login for your application.'),
    mailer_autoconfirm: z
      .boolean()
      .optional()
      .describe(
        'Users will need to confirm their email address before signing in for the first time.'
      ),
    mailer_secure_email_change_enabled: z
      .boolean()
      .optional()
      .describe(
        'Users will be required to confirm any email change on both the old email address and new email address. If disabled, only the new email is required to confirm.'
      ),
    security_update_password_require_reauthentication: z
      .boolean()
      .optional()
      .describe(
        'Users will need to be recently logged in to change their password without requiring reauthentication. (A user is considered recently logged in if the session was created within the last 24 hours.) If disabled, a user can change their password at any time.'
      ),
    password_hibp_enabled: z
      .boolean()
      .optional()
      .describe(
        'Rejects the use of known or easy to guess passwords on sign up or password change. Powered by the HaveIBeenPwned.org Pwned Passwords API.'
      ),
    password_min_length: z
      .number()
      .int()
      .min(6, 'Must be greater or equal to 6.')
      .describe(
        'Passwords shorter than this value will be rejected as weak. Minimum 6, recommended 8 or more.'
      ),
    password_required_characters: z
      .preprocess(
        (val) => (val === '' || val === null || val === undefined ? NO_REQUIRED_CHARACTERS : val),
        z.enum([
          NO_REQUIRED_CHARACTERS,
          'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ:0123456789',
          'abcdefghijklmnopqrstuvwxyz:ABCDEFGHIJKLMNOPQRSTUVWXYZ:0123456789',
          'abcdefghijklmnopqrstuvwxyz:ABCDEFGHIJKLMNOPQRSTUVWXYZ:0123456789:!@#$%^&*()_+-=[]{};\'\\\\:"|<>?,./`~',
        ])
      )
      .optional()
      .transform((val) => (val === NO_REQUIRED_CHARACTERS ? '' : val))
      .describe('Passwords that do not have at least one of each will be rejected as weak.'),
    mailer_otp_exp: z
      .number()
      .int()
      .min(0, 'Must be more than 0')
      .max(86400, 'Must be no more than 86400')
      .describe('Duration before an email otp / link expires in seconds.'),
    mailer_otp_length: z
      .number()
      .int()
      .min(6, 'Must be at least 6')
      .max(10, 'Must be no more than 10')
      .optional()
      .describe('Number of digits in the email OTP'),
  })
  .describe('Email provider settings.')
export type AuthEmailProviderSchema = z.infer<typeof authEmailProviderSchema>

export const authPhoneProviderSchema = z
  .object({
    external_phone_enabled: z
      .boolean()
      .optional()
      .describe('This will enable phone based login for your application'),
    sms_provider: z
      .enum(['twilio', 'messagebird', 'textlocal', 'vonage', 'twilio_verify'])
      .optional()
      .describe('External provider that will handle sending SMS messages'),
    // Twilio
    sms_twilio_account_sid: z.string().optional(),
    sms_twilio_auth_token: z.string().optional(),
    sms_twilio_message_service_sid: z.string().optional(),
    sms_twilio_content_sid: z
      .string()
      .optional()
      .describe('Twilio Content SID (Optional, For WhatsApp Only)'),
    // Twilio Verify
    sms_twilio_verify_account_sid: z.string().optional(),
    sms_twilio_verify_auth_token: z.string().optional(),
    sms_twilio_verify_message_service_sid: z.string().optional(),
    // Messagebird
    sms_messagebird_access_key: z.string().optional(),
    sms_messagebird_originator: z.string().optional(),
    // Textlocal
    sms_textlocal_api_key: z.string().optional(),
    sms_textlocal_sender: z.string().optional(),
    // Vonage
    sms_vonage_api_key: z.string().optional(),
    sms_vonage_api_secret: z.string().optional(),
    sms_vonage_from: z.string().optional(),
    // SMS Confirm settings
    sms_autoconfirm: z
      .boolean()
      .optional()
      .describe('Users will need to confirm their phone number before signing in.'),
    sms_otp_exp: z
      .number()
      .int()
      .optional()
      .describe('Duration before an SMS OTP expires in seconds.'),
    sms_otp_length: z.number().int().optional().describe('Number of digits in OTP.'),
    sms_template: z.string().optional().describe('To format the OTP code use `{{ .Code }}`'),
    sms_test_otp: z
      .string()
      .optional()
      .describe(
        'Register phone number and OTP combinations for testing as a comma separated list of <phone number>=<otp> pairs. Example: `18005550123=789012`'
      ),
    sms_test_otp_valid_until: z
      .string()
      .datetime({ message: 'Invalid datetime string.' })
      .optional()
      .describe(
        "Test phone number and OTP combinations won't be active past this date and time (local time zone)."
      ),
  })
  .describe('Phone provider settings.')
export type AuthPhoneProviderSchema = z.infer<typeof authPhoneProviderSchema>

export const authGoogleProviderObject = z.object({
  external_google_enabled: z.boolean().optional().describe('Enable Sign in with Google'),
  external_google_client_id: z
    .string()
    .regex(
      /^([a-z0-9-]+\.[a-z0-9-]+(\.[a-z0-9-]+)*(,[a-z0-9-]+\.[a-z0-9-]+(\.[a-z0-9-]+)*)*)$/i,
      'Google Client IDs should be a comma-separated list of domain-like strings.'
    )
    .optional(),
  external_google_secret: z
    .string()
    .regex(
      /^[a-z0-9.\/_-]*$/i,
      'Google OAuth Client Secrets usually contain letters, numbers, dots, dashes, and underscores.'
    )
    .optional(),
  external_google_skip_nonce_check: z
    .boolean()
    .optional()
    .describe('Allows ID tokens with any nonce to be accepted, which is less secure.'),
})

export const authGoogleProviderSchema = authGoogleProviderObject
  .superRefine((data, ctx) => {
    if (data.external_google_enabled && !data.external_google_client_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['external_google_client_id'],
        message: 'At least one Client ID is required when Google sign-in is enabled.',
      })
    }
    if (data.external_google_client_id && data.external_google_client_id.includes(' ')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['external_google_client_id'],
        message: 'Client IDs should not contain spaces.',
      })
    }
  })
  .describe('Google provider settings.')
export type AuthGoogleProviderSchema = z.infer<typeof authGoogleProviderSchema>

export const authConfigUpdateSchema = authGeneralSettingsSchema
  .merge(authEmailProviderSchema)
  .merge(authPhoneProviderSchema)
  .merge(authGoogleProviderObject)

export type AuthConfigUpdateSchema = z.infer<typeof authConfigUpdateSchema>

// A version used for partial updates (all fields optional)
export const authConfigUpdatePayloadSchema = authConfigUpdateSchema.partial()
