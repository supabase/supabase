export const OPTION_ORDER = [
  'catalog_uri',
  'vault_token',
  'warehouse',
  's3.endpoint',
  'vault_aws_access_key_id',
  'vault_aws_secret_access_key',
]

export const LABELS: Record<string, string> = {
  vault_aws_access_key_id: 'S3 Access Key ID',
  vault_aws_secret_access_key: 'S3 Secret Access Key',
  vault_token: 'Catalog Token',
  warehouse: 'Warehouse Name',
  's3.endpoint': 'S3 Endpoint',
  catalog_uri: 'Catalog URI',
}

export const DESCRIPTIONS: Record<string, string> = {
  vault_aws_access_key_id: 'Matches the AWS access key ID from a S3 Access Key.',
  vault_aws_secret_access_key: 'Matches the AWS secret access from a S3 Access Key.',
  vault_token: 'Corresponds to the service role key.',
  warehouse: 'Matches the name of the bucket.',
  's3.endpoint': '',
  catalog_uri: '',
}
