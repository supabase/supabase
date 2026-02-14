export const OPTION_ORDER = [
  'catalog_uri',
  'vault_token',
  'warehouse',
  's3.endpoint',
  'vault_aws_access_key_id',
  'vault_aws_secret_access_key',
]

export const LABELS: Record<string, string> = {
  vault_aws_access_key_id: 'S3 access key ID',
  vault_aws_secret_access_key: 'S3 secret access key',
  vault_token: 'Catalog token',
  warehouse: 'Warehouse name',
  's3.endpoint': 'S3 endpoint',
  catalog_uri: 'Catalog URI',
}

export const DESCRIPTIONS: Record<string, string> = {
  vault_aws_access_key_id: 'Matches the AWS access key ID from an S3 access key.',
  vault_aws_secret_access_key: 'Matches the AWS secret access from an S3 access key.',
  vault_token: 'Corresponds to the service role key.',
  warehouse: 'Matches the name of this bucket.',
  's3.endpoint': '',
  catalog_uri: '',
}

// [Joshen] For context we've decided to decouple ETL from Analytics Buckets for now
// So this flag just hides all "connect table" ETL flow related UI
// Depending on future decision if we intend to keep it that way, then we might be able
// to clean up + deprecate ConnectTablesDialog and other ETL related UI within Analytics Buckets
export const HIDE_REPLICATION_USER_FLOW = true
