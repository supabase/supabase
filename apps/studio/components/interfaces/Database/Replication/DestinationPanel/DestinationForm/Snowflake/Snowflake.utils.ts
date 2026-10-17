import type { UseFormReturn } from 'react-hook-form'

import { type DestinationPanelSchemaType } from '../DestinationForm.schema'

export type SnowflakeApiConfig = {
  account_id: string
  user: string
  private_key: string
  private_key_passphrase?: string
  database: string
  schema: string
  role?: string
}

type SnowflakeFieldPath =
  | 'snowflakeAccountId'
  | 'snowflakeUser'
  | 'snowflakePrivateKey'
  | 'snowflakeDatabase'
  | 'snowflakeSchema'

export type SnowflakeValidationIssue = {
  path: SnowflakeFieldPath
  message: string
}

const SNOWFLAKE_REQUIRED_FIELDS: { path: SnowflakeFieldPath; message: string }[] = [
  { path: 'snowflakeAccountId', message: 'Account ID is required.' },
  { path: 'snowflakeUser', message: 'User is required.' },
  { path: 'snowflakePrivateKey', message: 'Private key is required.' },
  { path: 'snowflakeDatabase', message: 'Database is required.' },
  { path: 'snowflakeSchema', message: 'Schema is required.' },
]

export const SNOWFLAKE_PRIVATE_KEY_FORMAT_MESSAGE =
  'Enter a valid RSA private key in PKCS #8 or PKCS #1 PEM format.'

export const isPrivateKey = (contents: string) => {
  const match = contents.match(
    /^\s*-----BEGIN ((?:ENCRYPTED |RSA )?PRIVATE KEY)-----\r?\n([\s\S]*?)\r?\n-----END \1-----\s*$/
  )

  return match !== null && match[2].trim().length > 0
}

export const getSnowflakeValidationIssues = (
  data: Pick<DestinationPanelSchemaType, SnowflakeFieldPath>,
  options: { secretsOptional?: boolean; validatePrivateKeyFormat?: boolean } = {}
): SnowflakeValidationIssue[] => {
  const { secretsOptional = false, validatePrivateKeyFormat = true } = options

  const issues: SnowflakeValidationIssue[] = SNOWFLAKE_REQUIRED_FIELDS.filter(({ path }) => {
    if (secretsOptional && path === 'snowflakePrivateKey') return false

    return !data[path]?.trim().length
  })

  const privateKey = data.snowflakePrivateKey?.trim() ?? ''

  // Format is checked on submit only. Live onChange validation would fail on every
  // keystroke while the user is still pasting or typing a key.
  if (privateKey && validatePrivateKeyFormat && !isPrivateKey(privateKey)) {
    issues.push({ path: 'snowflakePrivateKey', message: SNOWFLAKE_PRIVATE_KEY_FORMAT_MESSAGE })
  }

  return issues
}

export const MAX_PRIVATE_KEY_LENGTH = 10000

type PrivateKeyForm = Pick<
  UseFormReturn<DestinationPanelSchemaType>,
  'setError' | 'setValue' | 'clearErrors'
>

export const readPrivateKeyFile = async (
  file: File,
  form: PrivateKeyForm,
  isCurrentRequest: () => boolean
) => {
  if (file.size > MAX_PRIVATE_KEY_LENGTH) {
    if (isCurrentRequest()) {
      form.setError('snowflakePrivateKey', {
        message: 'Private key must be 10,000 characters or fewer.',
      })
    }
    return
  }

  try {
    const contents = await file.text()
    if (!isCurrentRequest()) return

    if (contents.length > MAX_PRIVATE_KEY_LENGTH) {
      form.setError('snowflakePrivateKey', {
        message: 'Private key must be 10,000 characters or fewer.',
      })
      return
    }

    if (!isPrivateKey(contents)) {
      form.setError('snowflakePrivateKey', { message: 'Select a P8 or PEM private key.' })
      return
    }

    form.setValue('snowflakePrivateKey', contents, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    form.clearErrors('snowflakePrivateKey')
  } catch {
    if (isCurrentRequest()) {
      form.setError('snowflakePrivateKey', { message: 'Could not read the selected private key.' })
    }
  }
}
