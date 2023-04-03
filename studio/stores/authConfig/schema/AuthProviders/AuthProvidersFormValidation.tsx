import { boolean, number, object, string } from 'yup'
import { urlRegex } from 'components/interfaces/Auth/Auth.constants'

const JSON_SCHEMA_VERSION = 'http://json-schema.org/draft-07/schema#'

const PROVIDER_EMAIL = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'Email',
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
    MAILER_OTP_EXP: {
      title: 'Mailer OTP Expiration',
      type: 'number',
      description: 'Duration before an email otp / link expires.',
      units: 'seconds',
    },
    PASSWORD_MIN_LENGTH: {
      title: 'Min password length',
      description: 'Users will not be able to use a password shorter than this.',
      type: 'number',
    },
  },
  validationSchema: object().shape({
    PASSWORD_MIN_LENGTH: number()
      .required('A password is required.')
      .min(6, 'Password length must be at least 6 characters long'),
    MAILER_OTP_EXP: number()
      .min(0, 'Must be more than 0')
      .max(86400, 'Must be no more than 86400')
      .required('This is required'),
  }),
  misc: {
    iconKey: 'email-icon2',
    helper: `To complete setup, add this authorisation callback URL to your app's configuration in the Apple Developer Console.
            [Learn more](https://supabase.com/docs/guides/auth/social-login/auth-apple#configure-your-services-id)`,
  },
}

const PROVIDER_PHONE = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'Phone',
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
      ],
    },
    RATE_LIMIT_SMS_SENT: {
      type: 'number',
      title: 'Rate limit for sending SMS messages',
      description: 'How many SMS messages can be sent per hour',
    },

    // Twilio
    SMS_TWILIO_ACCOUNT_SID: {
      type: 'string',
      title: 'Twilio Account Sid',
      show: {
        key: 'SMS_PROVIDER',
        matches: 'twilio',
      },
    },
    SMS_TWILIO_AUTH_TOKEN: {
      type: 'string',
      title: 'Twilio Auth Token',
      isSecret: true,
      show: {
        key: 'SMS_PROVIDER',
        matches: 'twilio',
      },
    },
    SMS_TWILIO_MESSAGE_SERVICE_SID: {
      type: 'string',
      title: 'Twilio Message Service Sid',
      show: {
        key: 'SMS_PROVIDER',
        matches: 'twilio',
      },
    },

    // Messagebird
    SMS_MESSAGEBIRD_ACCESS_KEY: {
      type: 'string',
      title: 'Messagebird Access Key',
      show: {
        key: 'SMS_PROVIDER',
        matches: 'messagebird',
      },
    },
    SMS_MESSAGEBIRD_ORIGINATOR: {
      type: 'string',
      title: 'Messagebird Originator',
      show: {
        key: 'SMS_PROVIDER',
        matches: 'messagebird',
      },
    },

    // Textloczl
    SMS_TEXTLOCAL_API_KEY: {
      type: 'string',
      title: 'Textlocal API Key',
      show: {
        key: 'SMS_PROVIDER',
        matches: 'textlocal',
      },
    },
    SMS_TEXTLOCAL_SENDER: {
      type: 'string',
      title: 'Textlocal Sender',
      show: {
        key: 'SMS_PROVIDER',
        matches: 'textlocal',
      },
    },

    // Vonage
    SMS_VONAGE_API_KEY: {
      type: 'string',
      title: 'Vonage API Key',
      show: {
        key: 'SMS_PROVIDER',
        matches: 'vonage',
      },
    },
    SMS_VONAGE_API_SECRET: {
      type: 'string',
      title: 'Vonage API Secret',
      show: {
        key: 'SMS_PROVIDER',
        matches: 'vonage',
      },
    },
    // [TODO] verify what this is?
    SMS_VONAGE_FROM: {
      type: 'string',
      title: 'Vonage From',
      show: {
        key: 'SMS_PROVIDER',
        matches: 'vonage',
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
    },
    SMS_OTP_LENGTH: {
      title: 'SMS OTP Length',
      type: 'number',
      description: 'Number of digits in OTP',
      units: 'digits',
    },
    SMS_TEMPLATE: {
      title: 'SMS Message',
      type: 'string',
      description: 'To format the OTP code use `{{ .Code }}`',
    },
  },
  validationSchema: object().shape({
    EXTERNAL_PHONE_ENABLED: boolean().required(),
    SMS_PROVIDER: string().required(),

    // Twilio
    SMS_TWILIO_ACCOUNT_SID: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      is: (EXTERNAL_PHONE_ENABLED: boolean, SMS_PROVIDER: string) => {
        return EXTERNAL_PHONE_ENABLED && SMS_PROVIDER === 'twilio'
      },
      then: (schema) => schema.required('Twilio Account SID is required'),
      otherwise: (schema) => schema,
    }),
    SMS_TWILIO_AUTH_TOKEN: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      is: (EXTERNAL_PHONE_ENABLED: boolean, SMS_PROVIDER: string) => {
        return EXTERNAL_PHONE_ENABLED && SMS_PROVIDER === 'twilio'
      },
      then: (schema) => schema.required('Twilio Auth Token is required'),
      otherwise: (schema) => schema,
    }),
    SMS_TWILIO_MESSAGE_SERVICE_SID: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      is: (EXTERNAL_PHONE_ENABLED: boolean, SMS_PROVIDER: string) => {
        return EXTERNAL_PHONE_ENABLED && SMS_PROVIDER === 'twilio'
      },
      then: (schema) => schema.required('Twilio Message Service SID is required'),
      otherwise: (schema) => schema,
    }),

    // Messagebird
    SMS_MESSAGEBIRD_ACCESS_KEY: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      is: (EXTERNAL_PHONE_ENABLED: boolean, SMS_PROVIDER: string) => {
        return EXTERNAL_PHONE_ENABLED && SMS_PROVIDER === 'messagebird'
      },
      then: (schema) => schema.required('Messagebird Access Key is required'),
      otherwise: (schema) => schema,
    }),
    SMS_MESSAGEBIRD_ORIGINATOR: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      is: (EXTERNAL_PHONE_ENABLED: boolean, SMS_PROVIDER: string) => {
        return EXTERNAL_PHONE_ENABLED && SMS_PROVIDER === 'messagebird'
      },
      then: (schema) => schema.required('Messagebird Originator is required'),
      otherwise: (schema) => schema,
    }),

    // Textlocal
    SMS_TEXTLOCAL_API_KEY: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      is: (EXTERNAL_PHONE_ENABLED: boolean, SMS_PROVIDER: string) => {
        return EXTERNAL_PHONE_ENABLED && SMS_PROVIDER === 'textlocal'
      },
      then: (schema) => schema.required('Textlocal API Key is required'),
      otherwise: (schema) => schema,
    }),
    SMS_TEXTLOCAL_SENDER: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      is: (EXTERNAL_PHONE_ENABLED: boolean, SMS_PROVIDER: string) => {
        return EXTERNAL_PHONE_ENABLED && SMS_PROVIDER === 'textlocal'
      },
      then: (schema) => schema.required('Textlocal Sender is required'),
      otherwise: (schema) => schema,
    }),

    // Vonage
    SMS_VONAGE_API_KEY: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      is: (EXTERNAL_PHONE_ENABLED: boolean, SMS_PROVIDER: string) => {
        return EXTERNAL_PHONE_ENABLED && SMS_PROVIDER === 'vonage'
      },
      then: (schema) => schema.required('Vonage API is required'),
      otherwise: (schema) => schema,
    }),
    SMS_VONAGE_API_SECRET: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      is: (EXTERNAL_PHONE_ENABLED: boolean, SMS_PROVIDER: string) => {
        return EXTERNAL_PHONE_ENABLED && SMS_PROVIDER === 'vonage'
      },
      then: (schema) => schema.required('Vonage API Secret is required'),
      otherwise: (schema) => schema,
    }),
    SMS_VONAGE_FROM: string().when(['EXTERNAL_PHONE_ENABLED', 'SMS_PROVIDER'], {
      is: (EXTERNAL_PHONE_ENABLED: boolean, SMS_PROVIDER: string) => {
        return EXTERNAL_PHONE_ENABLED && SMS_PROVIDER === 'vonage'
      },
      then: (schema) => schema.required('Vonage From is required'),
      otherwise: (schema) => schema,
    }),

    // Phone SMS
    SMS_OTP_EXP: number().min(0, 'Must be more than 0').required('This is required'),
    SMS_OTP_LENGTH: number().min(6, 'Must be 6 or more in length').required('This is required'),
    SMS_TEMPLATE: string().required('SMS template is required.'),
  }),
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
  properties: {
    EXTERNAL_APPLE_ENABLED: {
      title: 'Enable Apple provider',
      description: 'This will enable Apple login for your application',
      type: 'boolean',
    },
    EXTERNAL_APPLE_CLIENT_ID: {
      /**
       * to do: change docs
       */
      title: 'Services ID',
      description: `
Client identifier when authenticating or validating users.
[Learn more](https://developer.apple.com/documentation/sign_in_with_apple/configuring_your_environment_for_sign_in_with_apple)`,
      type: 'string',
    },
    EXTERNAL_IOS_BUNDLE_ID: {
      /**
       * to do: change docs
       */
      title: 'IOS Bundle ID',
      description: `The iOS app's unique identifier. [Learn more](https://developer.apple.com/documentation/appstoreconnectapi/bundle_ids)`,
      type: 'string',
    },
    EXTERNAL_APPLE_SECRET: {
      /**
       * to do: change docs
       */
      title: 'Secret key',
      description: `
The secret key is a JWT token that must be generated.
[Learn more](https://supabase.com/docs/guides/auth/social-login/auth-apple#generate-a-client_secret)`,
      type: 'string',
      isSecret: true,
    },
  },
  validationSchema: object().shape(
    {
      EXTERNAL_APPLE_ENABLED: boolean().required(),
      EXTERNAL_APPLE_SECRET: string().when(['EXTERNAL_APPLE_ENABLED'], {
        is: true,
        then: (schema) => schema.required('Secret key is required'),
        otherwise: (schema) => schema,
      }),
      EXTERNAL_APPLE_CLIENT_ID: string().when(
        ['EXTERNAL_APPLE_ENABLED', 'EXTERNAL_IOS_BUNDLE_ID'],
        {
          is: (EXTERNAL_APPLE_ENABLED: boolean, EXTERNAL_IOS_BUNDLE_ID: string) => {
            return EXTERNAL_APPLE_ENABLED && !EXTERNAL_IOS_BUNDLE_ID
          },
          then: (schema) => schema.required('Either the Services ID or iOS Bundle ID is required'),
          otherwise: (schema) => schema,
        }
      ),
      EXTERNAL_IOS_BUNDLE_ID: string().when(
        ['EXTERNAL_APPLE_ENABLED', 'EXTERNAL_APPLE_CLIENT_ID'],
        {
          is: (EXTERNAL_APPLE_ENABLED: boolean, EXTERNAL_APPLE_CLIENT_ID: string) => {
            return EXTERNAL_APPLE_ENABLED && !EXTERNAL_APPLE_CLIENT_ID
          },
          then: (schema) => schema.required('Either the Services ID or iOS Bundle ID is required'),
          otherwise: (schema) => schema,
        }
      ),
    },
    // this is necessary for the "either or" validation on EXTERNAL_APPLE_CLIENT_ID and EXTERNAL_IOS_BUNDLE_ID
    [['EXTERNAL_APPLE_CLIENT_ID', 'EXTERNAL_IOS_BUNDLE_ID']]
  ),
  misc: {
    iconKey: 'apple-icon',
    requiresRedirect: true,
    helper: `To complete setup, add this authorisation callback URL to your app's configuration in the Apple Developer Console.
            [Learn more](https://supabase.com/docs/guides/auth/social-login/auth-apple#configure-your-services-id)`,
    alert: {
      title: `Apple secrets will self expire every 6 months`,
      description: `You will need to regenerate before the 6 months elapses otherwise your users using Apple Login will no longer be able to log back in.`,
    },
  },
}

const EXTERNAL_PROVIDER_AZURE = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'Azure',
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
      then: (schema) => schema.required('Secret ID is required'),
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

const EXTERNAL_PROVIDER_GITHUB = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'GitHub',
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
  properties: {
    EXTERNAL_GOOGLE_ENABLED: {
      title: 'Google enabled',
      type: 'boolean',
    },
    // [TODO] Update docs
    EXTERNAL_GOOGLE_CLIENT_ID: {
      title: 'Client ID',
      type: 'string',
    },
    // [TODO] Update docs
    EXTERNAL_GOOGLE_SECRET: {
      title: 'Client Secret',
      type: 'string',
      isSecret: true,
    },
  },
  validationSchema: object().shape({
    EXTERNAL_GOOGLE_ENABLED: boolean().required(),
    EXTERNAL_GOOGLE_CLIENT_ID: string().when('EXTERNAL_GOOGLE_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client ID is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_GOOGLE_SECRET: string().when('EXTERNAL_GOOGLE_ENABLED', {
      is: true,
      then: (schema) => schema.required('Client Secret is required'),
      otherwise: (schema) => schema,
    }),
  }),
  misc: {
    iconKey: 'google-icon',
    requiresRedirect: true,
  },
}

// [TODO]: clarify the EXTERNAL_KEYCLOAK_URL property
const EXTERNAL_PROVIDER_KEYCLOAK = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'KeyCloak',
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

const EXTERNAL_PROVIDER_LINKEDIN = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'LinkedIn',
  properties: {
    EXTERNAL_LINKEDIN_ENABLED: {
      title: 'Linkedin enabled',
      type: 'boolean',
    },
    // [TODO] Update docs
    EXTERNAL_LINKEDIN_CLIENT_ID: {
      title: 'API Key',
      type: 'string',
    },
    // [TODO] Update docs
    EXTERNAL_LINKEDIN_SECRET: {
      title: 'API Secret Key',
      type: 'string',
      isSecret: true,
    },
  },
  validationSchema: object().shape({
    EXTERNAL_LINKEDIN_ENABLED: boolean().required(),
    EXTERNAL_LINKEDIN_CLIENT_ID: string().when('EXTERNAL_LINKEDIN_ENABLED', {
      is: true,
      then: (schema) => schema.required('API Key is required'),
      otherwise: (schema) => schema,
    }),
    EXTERNAL_LINKEDIN_SECRET: string().when('EXTERNAL_LINKEDIN_ENABLED', {
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
  title: 'Slack',
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

const EXTERNAL_PROVIDER_SPOTIFY = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'Spotify',
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

export const PROVIDER_SAML = {
  $schema: JSON_SCHEMA_VERSION,
  type: 'object',
  title: 'SAML 2.0',
  properties: {
    SAML_ENABLED: {
      title: 'Enable SAML 2.0 Single Sign-on',
      description:
        'You will need to use the [Supabase CLI](https://supabase.com/docs/guides/auth/sso/auth-sso-saml#managing-saml-20-connections) to set up SAML after enabling it',
      type: 'boolean',
    },
  },
  validationSchema: object().shape({
    SAML_ENABLED: boolean().required(),
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
  EXTERNAL_PROVIDER_GITHUB,
  EXTERNAL_PROVIDER_GITLAB,
  EXTERNAL_PROVIDER_GOOGLE,
  EXTERNAL_PROVIDER_KEYCLOAK,
  EXTERNAL_PROVIDER_LINKEDIN,
  EXTERNAL_PROVIDER_NOTION,
  EXTERNAL_PROVIDER_TWITCH,
  EXTERNAL_PROVIDER_TWITTER,
  EXTERNAL_PROVIDER_SLACK,
  EXTERNAL_PROVIDER_SPOTIFY,
  EXTERNAL_PROVIDER_WORKOS,
  EXTERNAL_PROVIDER_ZOOM,
]
