import { boolean, number, object, string } from 'yup'
import { urlRegex } from 'components/interfaces/Auth/Auth.constants'
import { ProjectAuthConfigData } from 'data/auth/auth-config-query'

const parseBase64URL = (b64url: string) => {
  return atob(b64url.replace(/[-]/g, '+').replace(/[_]/g, '/'))
}

const JSON_SCHEMA_VERSION = 'http://json-schema.org/draft-07/schema#'

const PROVIDER_EMAIL = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'Email',
  link: 'https://supabase.com/docs/guides/auth/passwords',
  properties: {
    EXTERNAL_EMAIL_ENABLED: {
      title: 'Enable Email provider',
      description: 'This will enable Email based signup and login for your application',
      type: 'boolean',
    },
    MAILER_AUTOCONFIRM: {
      title: 'Confirm email',
      description: `Users will need to confirm their email address before signing in for the first time.`,
      type: 'boolean',
    },
    MAILER_SECURE_EMAIL_CHANGE_ENABLED: {
      title: 'Secure email change',
      description: `Users will be required to confirm any email change on both the old email address and new email address.
      If disabled, only the new email is required to confirm.`,
      type: 'boolean',
    },
    SECURITY_UPDATE_PASSWORD_REQUIRE_REAUTHENTICATION: {
      title: 'Secure password change',
      description: `Users will need to be recently logged in to change their password without requiring reauthentication.
      If disabled, a user can change their password at any time.`,
      type: 'boolean',
    },
    MAILER_OTP_EXP: {
      title: 'Email OTP Expiration',
      type: 'number',
      description: 'Duration before an email otp / link expires.',
      units: 'seconds',
    },
    MAILER_OTP_LENGTH: {
      title: 'Email OTP Length',
      type: 'number',
      description: 'Number of digits in the email OTP',
      units: 'number',
    },
  },
  validationSchema: object().shape({
    MAILER_OTP_EXP: number()
      .min(0, 'Must be more than 0')
      .max(86400, 'Must be no more than 86400')
      .required('This is required'),
    MAILER_OTP_LENGTH: number().min(6, 'Must be at least 6').max(10, 'Must be no more than 10'),
  }),
  misc: {
    iconKey: 'email-icon2',
    helper: `To complete setup, add this authorisation callback URL to your app's configuration in the Apple Developer Console.
            [Learn more](https://supabase.com/docs/guides/auth/social-login/auth-apple#configure-your-services-id)`,
  },
}

const smsProviderValidation = (config: ProjectAuthConfigData, provider: string) => {
  return {
    is: (EXTERNAL_PHONE_ENABLED: boolean, SMS_PROVIDER: string) => {
      return EXTERNAL_PHONE_ENABLED && SMS_PROVIDER === provider && !config.HOOK_SEND_SMS_ENABLED
    },
  }
}

// getPhoneProviderValidationSchema generate the validation schema for the SMS providers
// based on whether the SMS hook is enabled
export const getPhoneProviderValidationSchema = (config: ProjectAuthConfigData) => {
  return object().shape({
    EXTERNAL_PHONE_ENABLED: boolean().required(),
    SMS_PROVIDER: string(),

    // Twilio
    SMS_TWILIO_ACCOUNT_SID: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      ...smsProviderValidation(config, 'twilio'),
      then: (schema) => schema.required('Twilio Account SID is required'),
      otherwise: (schema) => schema,
    }),
    SMS_TWILIO_AUTH_TOKEN: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      ...smsProviderValidation(config, 'twilio'),
      then: (schema) => schema.required('Twilio Auth Token is required'),
      otherwise: (schema) => schema,
    }),
    SMS_TWILIO_MESSAGE_SERVICE_SID: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      ...smsProviderValidation(config, 'twilio'),
      then: (schema) => schema.required('Twilio Message Service SID is required'),
      otherwise: (schema) => schema,
    }),

    // Twilio Verify
    SMS_TWILIO_VERIFY_ACCOUNT_SID: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      ...smsProviderValidation(config, 'twilio_verify'),
      then: (schema) => schema.required('Twilio Verify Account SID is required'),
      otherwise: (schema) => schema,
    }),
    SMS_TWILIO_VERIFY_AUTH_TOKEN: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      ...smsProviderValidation(config, 'twilio_verify'),
      then: (schema) => schema.required('Twilio Verify Auth Token is required'),
      otherwise: (schema) => schema,
    }),
    SMS_TWILIO_VERIFY_MESSAGE_SERVICE_SID: string().when(
      ['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'],
      {
        ...smsProviderValidation(config, 'twilio_verify'),
        then: (schema) => schema.required('Twilio Verify Service SID is required'),
        otherwise: (schema) => schema,
      }
    ),

    // Messagebird
    SMS_MESSAGEBIRD_ACCESS_KEY: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      ...smsProviderValidation(config, 'messagebird'),
      then: (schema) => schema.required('Messagebird Access Key is required'),
      otherwise: (schema) => schema,
    }),
    SMS_MESSAGEBIRD_ORIGINATOR: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      ...smsProviderValidation(config, 'messagebird'),
      then: (schema) => schema.required('Messagebird Originator is required'),
      otherwise: (schema) => schema,
    }),

    // Textlocal
    SMS_TEXTLOCAL_API_KEY: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      ...smsProviderValidation(config, 'textlocal'),
      then: (schema) => schema.required('Textlocal API Key is required'),
      otherwise: (schema) => schema,
    }),
    SMS_TEXTLOCAL_SENDER: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      ...smsProviderValidation(config, 'textlocal'),
      then: (schema) => schema.required('Textlocal Sender is required'),
      otherwise: (schema) => schema,
    }),

    // Vonage
    SMS_VONAGE_API_KEY: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      ...smsProviderValidation(config, 'vonage'),
      then: (schema) => schema.required('Vonage API is required'),
      otherwise: (schema) => schema,
    }),
    SMS_VONAGE_API_SECRET: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      ...smsProviderValidation(config, 'vonage'),
      then: (schema) => schema.required('Vonage API Secret is required'),
      otherwise: (schema) => schema,
    }),
    SMS_VONAGE_FROM: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      ...smsProviderValidation(config, 'vonage'),
      then: (schema) => schema.required('Vonage From is required'),
      otherwise: (schema) => schema,
    }),

    // Phone SMS
    SMS_OTP_EXP: number().min(0, 'Must be more than 0').required('This is required'),
    SMS_OTP_LENGTH: number().min(6, 'Must be 6 or more in length').required('This is required'),
    SMS_TEMPLATE: string().required('SMS template is required.'),
    SMS_TEST_OTP: string()
      .matches(
        /^\s*([0-9]{1,15}=[0-9]+)(\s*,\s*[0-9]{1,15}=[0-9]+)*\s*$/g,
        'Must be a comma-separated list of <phone number>=<OTP> pairs. Phone numbers should be in international format, without spaces, dashes or the + prefix. Example: 123456789=987654'
      )
      .trim()
      .transform((value: string) => value.replace(/\s+/g, '')),
    SMS_TEST_OTP_VALID_UNTIL: string().when(['SMS_TEST_OTP'], {
      is: (SMS_TEST_OTP: string | null) => {
        return !!SMS_TEST_OTP
      },
      then: (schema) => schema.required('You must provide a valid until date.'),
      otherwise: (schema) => schema.transform((value: string) => ''),
    }),
  })
}

const PROVIDER_PHONE = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'Phone',
  link: 'https://supabase.com/docs/guides/auth/phone-login',
  properties: {
    EXTERNAL_PHONE_ENABLED: {
      title: 'Enable Phone provider',
      description: 'This will enable phone based login for your application',
      type: 'boolean',
    },
    SMS_PROVIDER: {
      type: 'select',
      title: 'SMS provider',
      description: 'External provider that will handle sending SMS messages',
      enum: [
        { label: 'Twilio', value: 'twilio', icon: 'twilio-icon.svg' },
        { label: 'Messagebird', value: 'messagebird', icon: 'messagebird-icon.svg' },
        { label: 'Textlocal', value: 'textlocal', icon: 'textlocal-icon.png' },
        { label: 'Vonage', value: 'vonage', icon: 'vonage-icon.svg' },
        { label: 'Twilio Verify', value: 'twilio_verify', icon: 'twilio-icon.svg' },
      ],
    },

    // Twilio
    SMS_TWILIO_ACCOUNT_SID: {
      type: 'string',
      title: 'Twilio Account SID',
      show: {
        key: 'SMS_PROVIDER',
        matches: ['twilio'],
      },
    },
    SMS_TWILIO_AUTH_TOKEN: {
      type: 'string',
      title: 'Twilio Auth Token',
      isSecret: true,
      show: {
        key: 'SMS_PROVIDER',
        matches: ['twilio'],
      },
    },
    SMS_TWILIO_MESSAGE_SERVICE_SID: {
      type: 'string',
      title: 'Twilio Message Service SID',
      show: {
        key: 'SMS_PROVIDER',
        matches: ['twilio'],
      },
    },
    SMS_TWILIO_CONTENT_SID: {
      type: 'string',
      title: 'Twilio Content SID (Optional, For WhatsApp Only)',
      show: {
        key: 'SMS_PROVIDER',
        matches: ['twilio'],
      },
    },

    // Twilio Verify
    SMS_TWILIO_VERIFY_ACCOUNT_SID: {
      type: 'string',
      title: 'Twilio Account SID',
      show: {
        key: 'SMS_PROVIDER',
        matches: ['twilio_verify'],
      },
    },
    SMS_TWILIO_VERIFY_AUTH_TOKEN: {
      type: 'string',
      title: 'Twilio Auth Token',
      isSecret: true,
      show: {
        key: 'SMS_PROVIDER',
        matches: ['twilio_verify'],
      },
    },
    SMS_TWILIO_VERIFY_MESSAGE_SERVICE_SID: {
      type: 'string',
      title: 'Twilio Verify Service SID',
      show: {
        key: 'SMS_PROVIDER',
        matches: ['twilio_verify'],
      },
    },

    // Messagebird
    SMS_MESSAGEBIRD_ACCESS_KEY: {
      type: 'string',
      title: 'Messagebird Access Key',
      show: {
        key: 'SMS_PROVIDER',
        matches: ['messagebird'],
      },
    },
    SMS_MESSAGEBIRD_ORIGINATOR: {
      type: 'string',
      title: 'Messagebird Originator',
      show: {
        key: 'SMS_PROVIDER',
        matches: ['messagebird'],
      },
    },

    // Textloczl
    SMS_TEXTLOCAL_API_KEY: {
      type: 'string',
      title: 'Textlocal API Key',
      show: {
        key: 'SMS_PROVIDER',
        matches: ['textlocal'],
      },
    },
    SMS_TEXTLOCAL_SENDER: {
      type: 'string',
      title: 'Textlocal Sender',
      show: {
        key: 'SMS_PROVIDER',
        matches: ['textlocal'],
      },
    },

    // Vonage
    SMS_VONAGE_API_KEY: {
      type: 'string',
      title: 'Vonage API Key',
      show: {
        key: 'SMS_PROVIDER',
        matches: ['vonage'],
      },
    },
    SMS_VONAGE_API_SECRET: {
      type: 'string',
      title: 'Vonage API Secret',
      show: {
        key: 'SMS_PROVIDER',
        matches: ['vonage'],
      },
    },
    // [TODO] verify what this is?
    SMS_VONAGE_FROM: {
      type: 'string',
      title: 'Vonage From',
      show: {
        key: 'SMS_PROVIDER',
        matches: ['vonage'],
      },
    },

    // SMS Confirm settings
    SMS_AUTOCONFIRM: {
      title: 'Enable phone confirmations',
      type: 'boolean',
      description: 'Users will need to confirm their phone number before signing in.',
    },

    SMS_OTP_EXP: {
      title: 'SMS OTP Expiry',
      type: 'number',
      description: 'Duration before an SMS OTP expires',
      units: 'seconds',
      show: {
        key: 'SMS_PROVIDER',
        matches: ['twilio', 'messagebird', 'textlocal', 'vonage'],
      },
    },
    SMS_OTP_LENGTH: {
      title: 'SMS OTP Length',
      type: 'number',
      description: 'Number of digits in OTP',
      units: 'digits',
      show: {
        key: 'SMS_PROVIDER',
        matches: ['twilio', 'messagebird', 'textlocal', 'vonage'],
      },
    },
    SMS_TEMPLATE: {
      title: 'SMS Message',
      type: 'multiline-string',
      description: 'To format the OTP code use `{{ .Code }}`',
      show: {
        key: 'SMS_PROVIDER',
        matches: ['twilio', 'messagebird', 'textlocal', 'vonage'],
      },
    },
    SMS_TEST_OTP: {
      type: 'string',
      title: 'Test Phone Numbers and OTPs',
      description:
        'Register phone number and OTP combinations for testing as a comma separated list of <phone number>=<otp> pairs. Example: `18005550123=789012`',
    },
    SMS_TEST_OTP_VALID_UNTIL: {
      type: 'datetime',
      title: 'Test OTPs Valid Until',
      description:
        "Test phone number and OTP combinations won't be active past this date and time (local time zone).",
      show: {
        key: 'SMS_TEST_OTP',
      },
    },
  },
  validationSchema: null,
  misc: {
    iconKey: 'phone-icon4',
    helper: `To complete setup, add this authorisation callback URL to your app's configuration in the Apple Developer Console.
            [Learn more](https://supabase.com/docs/guides/auth/social-login/auth-apple#configure-your-services-id)`,
  },
}

const EXTERNAL_PROVIDER_APPLE = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'Apple',
  link: 'https://supabase.com/docs/guides/auth/social-login/auth-apple',
  properties: {
    EXTERNAL_APPLE_ENABLED: {
      title: 'Enable Sign in with Apple',
      description:
        'Enables Sign in with Apple on the web using OAuth or natively within iOS, macOS, watchOS or tvOS apps.',
      type: 'boolean',
    },
    EXTERNAL_APPLE_CLIENT_ID: {
      title: 'Service ID (for OAuth)',
      description: `Client identifier used in the OAuth flow on the web.
[Learn more](https://developer.apple.com/documentation/sign_in_with_apple/configuring_your_environment_for_sign_in_with_apple)`,
      type: 'string',
    },
    EXTERNAL_APPLE_SECRET: {
      title: 'Secret Key (for OAuth)',
      description: `Secret key used in the OAuth flow.
[Learn more](https://supabase.com/docs/guides/auth/social-login/auth-apple#generate-a-client_secret)`,
      type: 'string',
      isSecret: true,
    },
    EXTERNAL_APPLE_ADDITIONAL_CLIENT_IDS: {
      title: 'Authorized Client IDs (iOS, macOS, watchOS, tvOS bundle IDs or service IDs)',
      description: `Comma separated list of allowed Apple app bundle IDs for native sign in, or service IDs for Sign in with Apple JS. [Learn more](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js)`,
      type: 'string',
    },
  },
  validationSchema: object().shape({
    EXTERNAL_APPLE_ENABLED: boolean().required(),
    EXTERNAL_APPLE_SECRET: string()
      .when(['EXTERNAL_APPLE_ENABLED', 'EXTERNAL_APPLE_CLIENT_ID'], {
        is: (EXTERNAL_APPLE_ENABLED: boolean, EXTERNAL_APPLE_CLIENT_ID: string) => {
          return EXTERNAL_APPLE_ENABLED && !!EXTERNAL_APPLE_CLIENT_ID
        },
        then: (schema) =>
          schema
            .required('Secret key is required when using the OAuth flow.')
            .matches(/^[a-z0-9_-]+([.][a-z0-9_-]+){2}$/i, 'Secret key should be a JWT.')
            .test({
              message: 'Secret key is not a correctly generated JWT.',
              test: (value?: string): boolean => {
                if (!value) {
                  return true
                }
                try {
                  const parts = value.split('.').map((value) => parseBase64URL(value))
                  const header = JSON.parse(parts[0])
                  const body = JSON.parse(parts[1])
                  return (
                    typeof header === 'object' &&
                    typeof body === 'object' &&
                    header &&
                    body &&
                    header.alg === 'ES256' &&
                    body.aud === 'https://appleid.apple.com'
                  )
                } catch (e: any) {
                  console.log(e)
                  return false
                }

                return true
              },
            })
            .test({
              message: 'Secret key expires in less than 7 days!',
              test: (value?: string) => {
                if (!value) {
                  return true
                }
                try {
                  const parts = value.split('.').map((value) => parseBase64URL(value))
                  const body = JSON.parse(parts[1])
                  return Date.now() > body.exp - 7 * 24 * 60 * 60 * 1000
                } catch (e: any) {
                  console.log(e)
                  return false
                }

                return true
              },
            }),
      })
      .when(
        [
          'EXTERNAL_APPLE_ENABLED',
          'EXTERNAL_APPLE_ADDITIONAL_CLIENT_IDS',
          'EXTERNAL_APPLE_CLIENT_ID',
        ],
        {
          is: (
            EXTERNAL_APPLE_ENABLED: boolean,
            EXTERNAL_APPLE_ADDITIONAL_CLIENT_IDS: string,
            EXTERNAL_APPLE_CLIENT_ID: string
          ) => {
            return (
              EXTERNAL_APPLE_ENABLED &&
              !!EXTERNAL_APPLE_ADDITIONAL_CLIENT_IDS &&
              !EXTERNAL_APPLE_CLIENT_ID
            )
          },
          then: (schema) =>
            schema.matches(
              /^$/,
              'Secret Key should only be set if Service ID for OAuth is provided.'
            ),
        }
      ),
    EXTERNAL_APPLE_CLIENT_ID: string().matches(
      /^[a-z0-9.-]+$/i,
      'Invalid characters. Apple recommends a reverse-domain name style string (e.g. com.example.app).'
    ),
    EXTERNAL_APPLE_ADDITIONAL_CLIENT_IDS: string()
      .matches(
        /^([.a-z0-9-]+(,\s*[.a-z0-9-]+)*,*\s*)?$/i,
        'Invalid characters. Apple recommends a reverse-domain name style string (e.g. com.example.app). You must only use explicit bundle IDs, asterisks (*) are not allowed.'
      )
      .when(['EXTERNAL_APPLE_ENABLED', 'EXTERNAL_APPLE_CLIENT_ID'], {
        is: (EXTERNAL_APPLE_ENABLED: boolean, EXTERNAL_APPLE_CLIENT_ID: string) => {
          return EXTERNAL_APPLE_ENABLED && !EXTERNAL_APPLE_CLIENT_ID
        },
        then: (schema) =>
          schema.required(
            'At least one Authorized Client ID is required when not using the OAuth flow.'
          ),
      }),
  }),
  misc: {
    iconKey: 'apple-icon',
    requiresRedirect: true,
    helper: `Register this callback URL when using Sign in with Apple on the web in the Apple Developer Center.
            [Learn more](https://supabase.com/docs/guides/auth/social-login/auth-apple#configure-your-services-id)`,
    alert: {
      title: `Apple OAuth secret keys expire every 6 months`,
      description: `A new secret should be generated every 6 months, otherwise users on the web will not be able to sign in.`,
    },
  },
}

const EXTERNAL_PROVIDER_AZURE = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'Azure',
  link: 'https://supabase.com/docs/guides/auth/social-login/auth-azure',
  properties: {
    EXTERNAL_AZURE_ENABLED: {
      title: 'Azure enabled',
      type: 'boolean',
    },
    EXTERNAL_AZURE_CLIENT_ID: {
      // [TODO] Change docs
      title: 'Application (client) ID',
      type: 'string',
    },
    EXTERNAL_AZURE_SECRET: {
      // [TODO] Change docs
      title: 'Secret Value',
      description: `Enter the data from Value, not the Secret ID. [Learn more](https://supabase.com/docs/guides/auth/social-login/auth-azure#obtain-a-secret-id)`,
      type: 'string',
      isSecret: true,
    },
    EXTERNAL_AZURE_URL: {
      // [TODO] Change docs
      title: 'Azure Tenant URL',
      descriptionOptional: 'Optional',
      type: 'string',
    },
  },
  validationSchema: object().shape({
    EXTERNAL_AZURE_ENABLED: boolean().required(),
    EXTERNAL_AZURE_CLIENT_ID: string().when('EXTERNAL_AZURE_ENABLED', {
      is: true,
      then: (schema) => schema.required('Application (client) ID is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_AZURE_SECRET: string().when('EXTERNAL_AZURE_ENABLED', {
      is: true,
      then: (schema) => schema.required('Secret Value is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_AZURE_URL: string().matches(urlRegex, 'Must be a valid URL').optional(),
  }),
  misc: {
    iconKey: 'microsoft-icon',
    requiresRedirect: true,
  },
}

const EXTERNAL_PROVIDER_BITBUCKET = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'Bitbucket',
  link: 'https://supabase.com/docs/guides/auth/social-login/auth-bitbucket',
  properties: {
    EXTERNAL_BITBUCKET_ENABLED: {
      title: 'Bitbucket enabled',
      type: 'boolean',
    },
    EXTERNAL_BITBUCKET_CLIENT_ID: {
      title: 'Key',
      type: 'string',
    },
    EXTERNAL_BITBUCKET_SECRET: {
      title: 'Secret',
      type: 'string',
      isSecret: true,
    },
  },
  validationSchema: object().shape({
    EXTERNAL_BITBUCKET_ENABLED: boolean().required(),
    EXTERNAL_BITBUCKET_CLIENT_ID: string().when('EXTERNAL_BITBUCKET_ENABLED', {
      is: true,
      then: (schema) => schema.required('Key is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_BITBUCKET_SECRET: string().when('EXTERNAL_BITBUCKET_ENABLED', {
      is: true,
      then: (schema) => schema.required('Secret is required'),
      otherwise: (schema) => schema,
    }),
  }),
  misc: {
    iconKey: 'bitbucket-icon',
    requiresRedirect: true,
  },
}

const EXTERNAL_PROVIDER_DISCORD = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'Discord',
  link: 'https://supabase.com/docs/guides/auth/social-login/auth-discord?',
  properties: {
    EXTERNAL_DISCORD_ENABLED: {
      title: 'Discord enabled',
      type: 'boolean',
    },
    EXTERNAL_DISCORD_CLIENT_ID: {
      title: 'Client ID',
      type: 'string',
    },
    EXTERNAL_DISCORD_SECRET: {
      title: 'Client Secret',
      type: 'string',
      isSecret: true,
    },
  },
  validationSchema: object().shape({
    EXTERNAL_DISCORD_ENABLED: boolean().required(),
    EXTERNAL_DISCORD_CLIENT_ID: string().when('EXTERNAL_DISCORD_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client ID is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_DISCORD_SECRET: string().when('EXTERNAL_DISCORD_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client Secret is required'),
      otherwise: (schema) => schema,
    }),
  }),
  misc: {
    iconKey: 'discord-icon',
    requiresRedirect: true,
  },
}

const EXTERNAL_PROVIDER_FACEBOOK = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'Facebook',
  link: 'https://supabase.com/docs/guides/auth/social-login/auth-facebook',
  properties: {
    EXTERNAL_FACEBOOK_ENABLED: {
      title: 'Facebook enabled',
      type: 'boolean',
    },
    EXTERNAL_FACEBOOK_CLIENT_ID: {
      title: 'Facebook client ID',
      type: 'string',
    },
    EXTERNAL_FACEBOOK_SECRET: {
      title: 'Facebook secret',
      type: 'string',
      isSecret: true,
    },
  },
  validationSchema: object().shape({
    EXTERNAL_FACEBOOK_ENABLED: boolean().required(),
    EXTERNAL_FACEBOOK_CLIENT_ID: string().when('EXTERNAL_FACEBOOK_ENABLED', {
      is: true,
      then: (schema) => schema.required('"Facebook client ID" is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_FACEBOOK_SECRET: string().when('EXTERNAL_FACEBOOK_ENABLED', {
      is: true,
      then: (schema) => schema.required('"Facebook secret" is required'),
      otherwise: (schema) => schema,
    }),
  }),
  misc: {
    iconKey: 'facebook-icon',
    requiresRedirect: true,
  },
}

const EXTERNAL_PROVIDER_FIGMA = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'Figma',
  link: 'https://supabase.com/docs/guides/auth/social-login/auth-figma',
  properties: {
    EXTERNAL_FIGMA_ENABLED: {
      title: 'Figma enabled',
      type: 'boolean',
    },
    EXTERNAL_FIGMA_CLIENT_ID: {
      title: 'Client ID',
      type: 'string',
    },
    EXTERNAL_FIGMA_SECRET: {
      title: 'Client Secret',
      type: 'string',
      isSecret: true,
    },
  },
  validationSchema: object().shape({
    EXTERNAL_FIGMA_ENABLED: boolean().required(),
    EXTERNAL_FIGMA_CLIENT_ID: string().when('EXTERNAL_FIGMA_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client ID is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_FIGMA_SECRET: string().when('EXTERNAL_FIGMA_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client Secret is required'),
      otherwise: (schema) => schema,
    }),
  }),
  misc: {
    iconKey: 'figma-icon',
    requiresRedirect: true,
  },
}

const EXTERNAL_PROVIDER_GITHUB = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'GitHub',
  link: 'https://supabase.com/docs/guides/auth/social-login/auth-github',
  properties: {
    EXTERNAL_GITHUB_ENABLED: {
      title: 'GitHub enabled',
      type: 'boolean',
    },
    EXTERNAL_GITHUB_CLIENT_ID: {
      title: 'Client ID',
      type: 'string',
    },
    EXTERNAL_GITHUB_SECRET: {
      title: 'Client Secret',
      type: 'string',
      isSecret: true,
    },
  },
  validationSchema: object().shape({
    EXTERNAL_GITHUB_ENABLED: boolean().required(),
    EXTERNAL_GITHUB_CLIENT_ID: string().when('EXTERNAL_GITHUB_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client ID is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_GITHUB_SECRET: string().when('EXTERNAL_GITHUB_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client Secret is required'),
      otherwise: (schema) => schema,
    }),
  }),
  misc: {
    iconKey: 'github-icon',
    requiresRedirect: true,
  },
}

const EXTERNAL_PROVIDER_GITLAB = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'GitLab',
  link: 'https://supabase.com/docs/guides/auth/social-login/auth-gitlab',
  properties: {
    EXTERNAL_GITLAB_ENABLED: {
      title: 'GitLab enabled',
      type: 'boolean',
    },
    // [TODO] Update docs
    EXTERNAL_GITLAB_CLIENT_ID: {
      title: 'Application ID',
      type: 'string',
    },
    // [TODO] Update docs
    EXTERNAL_GITLAB_SECRET: {
      title: 'Secret',
      type: 'string',
      isSecret: true,
    },
    EXTERNAL_GITLAB_URL: {
      title: 'Self Hosted GitLab URL',
      descriptionOptional: 'Optional',
      type: 'string',
    },
  },
  validationSchema: object().shape({
    EXTERNAL_GITLAB_ENABLED: boolean().required(),
    EXTERNAL_GITLAB_CLIENT_ID: string().when('EXTERNAL_GITLAB_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client ID is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_GITLAB_SECRET: string().when('EXTERNAL_GITLAB_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client Secret is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_GITLAB_URL: string().matches(urlRegex, 'Must be a valid URL').optional(),
  }),
  misc: {
    iconKey: 'gitlab-icon',
    requiresRedirect: true,
  },
}

const EXTERNAL_PROVIDER_GOOGLE = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'Google',
  link: 'https://supabase.com/docs/guides/auth/social-login/auth-google',
  properties: {
    EXTERNAL_GOOGLE_ENABLED: {
      title: 'Enable Sign in with Google',
      description:
        'Enables Sign in with Google on the web using OAuth or One Tap, or in Android apps or Chrome extensions.',
      type: 'boolean',
    },
    EXTERNAL_GOOGLE_CLIENT_ID: {
      title: 'Client ID (for OAuth)',
      description: 'Client ID to use with the OAuth flow on the web.',
      type: 'string',
    },
    EXTERNAL_GOOGLE_SECRET: {
      title: 'Client Secret (for OAuth)',
      description: 'Client Secret to use with the OAuth flow on the web.',
      type: 'string',
      isSecret: true,
    },
    EXTERNAL_GOOGLE_ADDITIONAL_CLIENT_IDS: {
      title: 'Authorized Client IDs (for Android, One Tap, and Chrome extensions)',
      description:
        'Comma separated list of client IDs of Android apps, One Tap or Chrome extensions that are allowed to log in to your project.',
      type: 'string',
    },
    EXTERNAL_GOOGLE_SKIP_NONCE_CHECK: {
      title: 'Skip nonce checks',
      description:
        "Allows ID tokens with any nonce to be accepted, which is less secure. Useful in situations where you don't have access to the nonce used to issue the ID token, such with iOS.",
      type: 'boolean',
    },
  },
  validationSchema: object().shape({
    EXTERNAL_GOOGLE_ENABLED: boolean().required(),
    EXTERNAL_GOOGLE_SECRET: string()
      .when(['EXTERNAL_GOOGLE_ENABLED', 'EXTERNAL_GOOGLE_CLIENT_ID'], {
        is: (EXTERNAL_GOOGLE_ENABLED: boolean, EXTERNAL_GOOGLE_CLIENT_ID: string) => {
          return EXTERNAL_GOOGLE_ENABLED && !!EXTERNAL_GOOGLE_CLIENT_ID
        },
        then: (schema) =>
          schema
            .matches(
              /^[a-z0-9.\/_-]*$/i,
              'Invalid characters. Google OAuth Client Secrets usually contain letters, numbers, dots, dashes and underscores.'
            )
            .required('Client Secret is required when using the OAuth flow.'),
      })
      .when(
        [
          'EXTERNAL_GOOGLE_ENABLED',
          'EXTERNAL_GOOGLE_ADDITIONAL_CLIENT_IDS',
          'EXTERNAL_GOOGLE_CLIENT_ID',
        ],
        {
          is: (
            EXTERNAL_GOOGLE_ENABLED: boolean,
            EXTERNAL_GOOGLE_ADDITIONAL_CLIENT_IDS: string,
            EXTERNAL_GOOGLE_CLIENT_ID: string
          ) => {
            return (
              EXTERNAL_GOOGLE_ENABLED &&
              !!EXTERNAL_GOOGLE_ADDITIONAL_CLIENT_IDS &&
              !EXTERNAL_GOOGLE_CLIENT_ID
            )
          },
          then: (schema) =>
            schema.matches(
              /^$/,
              'Client Secret should only be set when Client ID for OAuth is set.'
            ),
        }
      ),
    EXTERNAL_GOOGLE_CLIENT_ID: string().matches(
      /^([a-z0-9-]+([.][a-z0-9-]+)+)?$/i,
      'Invalid characters. Google OAuth Client IDs are usually a domain-name (e.g. 01234567890-abcdefghijklmnopqrstuvwxyz012345.apps.googleusercontent.com).'
    ),
    EXTERNAL_GOOGLE_ADDITIONAL_CLIENT_IDS: string()
      .matches(
        /^([a-z0-9-]+([.][a-z0-9-]+)*(,\s*[a-z0-9-]+([.][a-z0-9-]+)*)*,*\s*)?$/i,
        'Invalid characters. Google Client IDs are usually a domain-name style string (e.g. com.example.com.app or *.apps.googleusercontent.com).'
      )

      .when(['EXTERNAL_GOOGLE_ENABLED', 'EXTERNAL_GOOGLE_CLIENT_ID'], {
        is: (EXTERNAL_GOOGLE_ENABLED: boolean, EXTERNAL_GOOGLE_CLIENT_ID: string) => {
          return EXTERNAL_GOOGLE_ENABLED && !EXTERNAL_GOOGLE_CLIENT_ID
        },
        then: (schema) =>
          schema.required(
            'At least one Authorized Client ID is required when not using the OAuth flow.'
          ),
      }),
    EXTERNAL_GOOGLE_SKIP_NONCE_CHECK: boolean().required(),
  }),
  misc: {
    iconKey: 'google-icon',
    requiresRedirect: true,
    helper: `Register this callback URL when using Sign-in with Google on the web using OAuth.
            [Learn more](https://supabase.com/docs/guides/auth/social-login/auth-google#configure-your-services-id)`,
  },
}

const EXTERNAL_PROVIDER_KAKAO = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'Kakao',
  link: 'https://supabase.com/docs/guides/auth/social-login/auth-kakao',
  properties: {
    EXTERNAL_KAKAO_ENABLED: {
      title: 'Kakao enabled',
      type: 'boolean',
    },
    // [TODO] Update docs
    EXTERNAL_KAKAO_CLIENT_ID: {
      title: 'REST API Key',
      type: 'string',
    },
    // [TODO] Update docs
    EXTERNAL_KAKAO_SECRET: {
      title: 'Client Secret Code',
      type: 'string',
      isSecret: true,
    },
  },
  validationSchema: object().shape({
    EXTERNAL_KAKAO_ENABLED: boolean().required(),
    EXTERNAL_KAKAO_CLIENT_ID: string().when('EXTERNAL_KAKAO_ENABLED', {
      is: true,
      then: (schema) => schema.required('REST API Key is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_KAKAO_SECRET: string().when('EXTERNAL_KAKAO_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client Secret Code is required'),
      otherwise: (schema) => schema,
    }),
  }),
  misc: {
    iconKey: 'kakao-icon',
    requiresRedirect: true,
  },
}

// [TODO]: clarify the EXTERNAL_KEYCLOAK_URL property
const EXTERNAL_PROVIDER_KEYCLOAK = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'KeyCloak',
  link: 'https://supabase.com/docs/guides/auth/social-login/auth-keycloak',
  properties: {
    EXTERNAL_KEYCLOAK_ENABLED: {
      title: 'Keycloak enabled',
      type: 'boolean',
    },
    EXTERNAL_KEYCLOAK_CLIENT_ID: {
      title: 'Client ID',
      type: 'string',
    },
    EXTERNAL_KEYCLOAK_SECRET: {
      title: 'Secret',
      type: 'string',
      isSecret: true,
    },
    EXTERNAL_KEYCLOAK_URL: {
      title: 'Realm URL',
      description: '',
      type: 'string',
    },
  },
  validationSchema: object().shape({
    EXTERNAL_KEYCLOAK_ENABLED: boolean().required(),
    EXTERNAL_KEYCLOAK_CLIENT_ID: string().when('EXTERNAL_KEYCLOAK_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client ID is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_KEYCLOAK_SECRET: string().when('EXTERNAL_KEYCLOAK_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client secret is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_KEYCLOAK_URL: string().when('EXTERNAL_KEYCLOAK_ENABLED', {
      is: true,
      then: (schema) =>
        schema.matches(urlRegex, 'Must be a valid URL').required('Realm URL is required'),
      otherwise: (schema) => schema.matches(urlRegex, 'Must be a valid URL'),
    }),
  }),
  misc: {
    iconKey: 'keycloak-icon',
    requiresRedirect: true,
  },
}

const EXTERNAL_PROVIDER_LINKEDIN_OIDC = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'LinkedIn (OIDC)',
  link: 'https://supabase.com/docs/guides/auth/social-login/auth-linkedin',
  properties: {
    EXTERNAL_LINKEDIN_OIDC_ENABLED: {
      title: 'LinkedIn enabled',
      type: 'boolean',
    },
    EXTERNAL_LINKEDIN_OIDC_CLIENT_ID: {
      title: 'API Key',
      type: 'string',
    },
    EXTERNAL_LINKEDIN_OIDC_SECRET: {
      title: 'API Secret Key',
      type: 'string',
      isSecret: true,
    },
  },
  validationSchema: object().shape({
    EXTERNAL_LINKEDIN_OIDC_ENABLED: boolean().required(),
    EXTERNAL_LINKEDIN_OIDC_CLIENT_ID: string().when('EXTERNAL_LINKEDIN_OIDC_ENABLED', {
      is: true,
      then: (schema) => schema.required('API Key is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_LINKEDIN_OIDC_SECRET: string().when('EXTERNAL_LINKEDIN_OIDC_ENABLED', {
      is: true,
      then: (schema) => schema.required('API Secret Key is required'),
      otherwise: (schema) => schema,
    }),
  }),
  misc: {
    iconKey: 'linkedin-icon',
    requiresRedirect: true,
  },
}

const EXTERNAL_PROVIDER_NOTION = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'Notion',
  link: 'https://supabase.com/docs/guides/auth/social-login/auth-notion',
  properties: {
    EXTERNAL_NOTION_ENABLED: {
      title: 'Notion enabled',
      type: 'boolean',
    },
    EXTERNAL_NOTION_CLIENT_ID: {
      title: 'OAuth client ID',
      type: 'string',
    },
    EXTERNAL_NOTION_SECRET: {
      title: 'OAuth client secret',
      type: 'string',
      isSecret: true,
    },
  },
  validationSchema: object().shape({
    EXTERNAL_NOTION_ENABLED: boolean().required(),
    EXTERNAL_NOTION_CLIENT_ID: string().when('EXTERNAL_NOTION_ENABLED', {
      is: true,
      then: (schema) => schema.required('OAuth client ID is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_NOTION_SECRET: string().when('EXTERNAL_NOTION_ENABLED', {
      is: true,
      then: (schema) => schema.required('OAuth client secret is required'),
      otherwise: (schema) => schema,
    }),
  }),
  misc: {
    iconKey: 'notion-icon',
    requiresRedirect: true,
  },
}

const EXTERNAL_PROVIDER_TWITCH = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'Twitch',
  link: 'https://supabase.com/docs/guides/auth/social-login/auth-twitch',
  properties: {
    EXTERNAL_TWITCH_ENABLED: {
      title: 'Twitch enabled',
      type: 'boolean',
    },
    EXTERNAL_TWITCH_CLIENT_ID: {
      title: 'Client ID',
      type: 'string',
    },
    EXTERNAL_TWITCH_SECRET: {
      title: 'Client secret',
      type: 'string',
      isSecret: true,
    },
  },
  validationSchema: object().shape({
    EXTERNAL_TWITCH_ENABLED: boolean().required(),
    EXTERNAL_TWITCH_CLIENT_ID: string().when('EXTERNAL_TWITCH_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client ID is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_TWITCH_SECRET: string().when('EXTERNAL_TWITCH_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client secret is required'),
      otherwise: (schema) => schema,
    }),
  }),
  misc: {
    iconKey: 'twitch-icon',
    requiresRedirect: true,
  },
}

const EXTERNAL_PROVIDER_TWITTER = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'Twitter',
  link: 'https://supabase.com/docs/guides/auth/social-login/auth-twitter',
  properties: {
    EXTERNAL_TWITTER_ENABLED: {
      title: 'Twitter enabled',
      type: 'boolean',
    },
    EXTERNAL_TWITTER_CLIENT_ID: {
      title: 'API Key',
      type: 'string',
    },
    EXTERNAL_TWITTER_SECRET: {
      title: 'API Secret Key',
      type: 'string',
      isSecret: true,
    },
  },
  validationSchema: object().shape({
    EXTERNAL_TWITTER_ENABLED: boolean().required(),
    EXTERNAL_TWITTER_CLIENT_ID: string().when('EXTERNAL_TWITTER_ENABLED', {
      is: true,
      then: (schema) => schema.required('API Key is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_TWITTER_SECRET: string().when('EXTERNAL_TWITTER_ENABLED', {
      is: true,
      then: (schema) => schema.required('API Secret Key is required'),
      otherwise: (schema) => schema,
    }),
  }),
  misc: {
    iconKey: 'twitter-icon',
    requiresRedirect: true,
  },
}

const EXTERNAL_PROVIDER_SLACK = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'Slack (Deprecated)',
  link: 'https://supabase.com/docs/guides/auth/social-login/auth-slack',
  properties: {
    EXTERNAL_SLACK_ENABLED: {
      title: 'Slack enabled',
      type: 'boolean',
    },
    EXTERNAL_SLACK_CLIENT_ID: {
      title: 'Client ID',
      type: 'string',
    },
    EXTERNAL_SLACK_SECRET: {
      title: 'Client Secret',
      type: 'string',
      isSecret: true,
    },
  },
  validationSchema: object().shape({
    EXTERNAL_SLACK_ENABLED: boolean().required(),
    EXTERNAL_SLACK_CLIENT_ID: string().when('EXTERNAL_SLACK_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client ID is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_SLACK_SECRET: string().when('EXTERNAL_SLACK_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client Secret is required'),
      otherwise: (schema) => schema,
    }),
  }),
  misc: {
    iconKey: 'slack-icon',
    requiresRedirect: true,
  },
}

const EXTERNAL_PROVIDER_SLACK_OIDC = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'Slack (OIDC)',
  link: 'https://supabase.com/docs/guides/auth/social-login/auth-slack',
  properties: {
    EXTERNAL_SLACK_OIDC_ENABLED: {
      title: 'Slack enabled',
      type: 'boolean',
    },
    EXTERNAL_SLACK_OIDC_CLIENT_ID: {
      title: 'Client ID',
      type: 'string',
    },
    EXTERNAL_SLACK_OIDC_SECRET: {
      title: 'Client Secret',
      type: 'string',
      isSecret: true,
    },
  },
  validationSchema: object().shape({
    EXTERNAL_SLACK_OIDC_ENABLED: boolean().required(),
    EXTERNAL_SLACK_OIDC_CLIENT_ID: string().when('EXTERNAL_SLACK_OIDC_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client ID is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_SLACK_OIDC_SECRET: string().when('EXTERNAL_SLACK_OIDC_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client Secret is required'),
      otherwise: (schema) => schema,
    }),
  }),
  misc: {
    iconKey: 'slack-icon',
    requiresRedirect: true,
  },
}

const EXTERNAL_PROVIDER_SPOTIFY = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'Spotify',
  link: 'https://supabase.com/docs/guides/auth/social-login/auth-spotify',
  properties: {
    EXTERNAL_SPOTIFY_ENABLED: {
      title: 'Spotify enabled',
      type: 'boolean',
    },
    EXTERNAL_SPOTIFY_CLIENT_ID: {
      title: 'Client ID',
      type: 'string',
    },
    EXTERNAL_SPOTIFY_SECRET: {
      title: 'Client Secret',
      type: 'string',
      isSecret: true,
    },
  },
  validationSchema: object().shape({
    EXTERNAL_SPOTIFY_ENABLED: boolean().required(),
    EXTERNAL_SPOTIFY_CLIENT_ID: string().when('EXTERNAL_SPOTIFY_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client ID is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_SPOTIFY_SECRET: string().when('EXTERNAL_SPOTIFY_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client Secret is required'),
      otherwise: (schema) => schema,
    }),
  }),
  misc: {
    iconKey: 'spotify-icon',
    requiresRedirect: true,
  },
}

const EXTERNAL_PROVIDER_WORKOS = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'WorkOS',
  link: 'https://supabase.com/docs/guides/auth/social-login/auth-workos',
  properties: {
    EXTERNAL_WORKOS_ENABLED: {
      title: 'WorkOS enabled',
      type: 'boolean',
    },
    EXTERNAL_WORKOS_URL: {
      title: 'WorkOS URL',
      type: 'string',
    },
    EXTERNAL_WORKOS_CLIENT_ID: {
      title: 'Client ID',
      type: 'string',
    },
    EXTERNAL_WORKOS_SECRET: {
      title: 'Secret Key',
      type: 'string',
      isSecret: true,
    },
  },
  validationSchema: object().shape({
    EXTERNAL_WORKOS_ENABLED: boolean().required(),
    EXTERNAL_WORKOS_URL: string()
      .matches(urlRegex, 'Must be a valid URL')
      .when('EXTERNAL_WORKOS_ENABLED', {
        is: true,
        then: (schema) => schema.required('WorkOS URL is required'),
        otherwise: (schema) => schema,
      }),
    EXTERNAL_WORKOS_CLIENT_ID: string().when('EXTERNAL_WORKOS_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client ID is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_WORKOS_SECRET: string().when('EXTERNAL_WORKOS_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client Secret is required'),
      otherwise: (schema) => schema,
    }),
  }),
  misc: {
    iconKey: 'workos-icon',
    requiresRedirect: true,
  },
}

const EXTERNAL_PROVIDER_ZOOM = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'Zoom',
  link: 'https://supabase.com/docs/guides/auth/social-login/auth-zoom',
  properties: {
    EXTERNAL_ZOOM_ENABLED: {
      title: 'Zoom enabled',
      type: 'boolean',
    },
    EXTERNAL_ZOOM_CLIENT_ID: {
      title: 'Client ID',
      type: 'string',
    },
    EXTERNAL_ZOOM_SECRET: {
      title: 'Client secret',
      type: 'string',
      isSecret: true,
    },
  },
  validationSchema: object().shape({
    EXTERNAL_ZOOM_ENABLED: boolean().required(),
    EXTERNAL_ZOOM_CLIENT_ID: string().when('EXTERNAL_ZOOM_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client ID is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_ZOOM_SECRET: string().when('EXTERNAL_ZOOM_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client secret is required'),
      otherwise: (schema) => schema,
    }),
  }),
  misc: {
    iconKey: 'zoom-icon',
    requiresRedirect: true,
  },
}

const PROVIDER_SAML = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'SAML 2.0',
  link: 'https://supabase.com/docs/guides/auth/enterprise-sso',
  properties: {
    SAML_ENABLED: {
      title: 'Enable SAML 2.0 Single Sign-on',
      description:
        'You will need to use the [Supabase CLI](https://supabase.com/docs/guides/auth/sso/auth-sso-saml#managing-saml-20-connections) to set up SAML after enabling it',
      type: 'boolean',
    },
    SAML_EXTERNAL_URL: {
      title: 'SAML metadata URL',
      description:
        'You may use a different SAML metadata URL from what is defined with the API External URL. Please validate that your SAML External URL can reach the Custom Domain or Project URL.',
      descriptionOptional: 'Optional',
      type: 'string',
    },
    SAML_ALLOW_ENCRYPTED_ASSERTIONS: {
      title: 'Allow encrypted SAML Assertions',
      description:
        'Some SAML Identity Providers require support for encrypted assertions. Usually this is not necessary.',
      descriptionOptional: 'Optional',
      type: 'boolean',
    },
  },
  validationSchema: object().shape({
    SAML_ENABLED: boolean().required(),
    SAML_EXTERNAL_URL: string().matches(urlRegex, 'Must be a valid URL').optional(),
    SAML_ALLOW_ENCRYPTED_ASSERTIONS: boolean().optional(),
  }),
  misc: {
    iconKey: 'saml-icon',
  },
}

export const PROVIDERS_SCHEMAS = [
  PROVIDER_EMAIL,
  PROVIDER_PHONE,
  PROVIDER_SAML,
  EXTERNAL_PROVIDER_APPLE,
  EXTERNAL_PROVIDER_AZURE,
  EXTERNAL_PROVIDER_BITBUCKET,
  EXTERNAL_PROVIDER_DISCORD,
  EXTERNAL_PROVIDER_FACEBOOK,
  EXTERNAL_PROVIDER_FIGMA,
  EXTERNAL_PROVIDER_GITHUB,
  EXTERNAL_PROVIDER_GITLAB,
  EXTERNAL_PROVIDER_GOOGLE,
  EXTERNAL_PROVIDER_KAKAO,
  EXTERNAL_PROVIDER_KEYCLOAK,
  EXTERNAL_PROVIDER_LINKEDIN_OIDC,
  EXTERNAL_PROVIDER_NOTION,
  EXTERNAL_PROVIDER_TWITCH,
  EXTERNAL_PROVIDER_TWITTER,
  EXTERNAL_PROVIDER_SLACK_OIDC,
  EXTERNAL_PROVIDER_SLACK,
  EXTERNAL_PROVIDER_SPOTIFY,
  EXTERNAL_PROVIDER_WORKOS,
  EXTERNAL_PROVIDER_ZOOM,
]
