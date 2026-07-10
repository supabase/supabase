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
  { path: 'snowflakeAccountId', message: 'Account ID is required' },
  { path: 'snowflakeUser', message: 'User is required' },
  { path: 'snowflakePrivateKey', message: 'Private key is required' },
  { path: 'snowflakeDatabase', message: 'Database is required' },
  { path: 'snowflakeSchema', message: 'Schema is required' },
]

export const getSnowflakeValidationIssues = (
  data: Pick<DestinationPanelSchemaType, SnowflakeFieldPath>,
  options: { secretsOptional?: boolean } = {}
): SnowflakeValidationIssue[] =>
  SNOWFLAKE_REQUIRED_FIELDS.filter(({ path }) => {
    if (options.secretsOptional && path === 'snowflakePrivateKey') return false

    return !data[path]?.trim().length
  })
