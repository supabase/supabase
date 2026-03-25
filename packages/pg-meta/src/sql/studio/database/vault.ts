import { literal } from '../../../pg-format'

export const getCreateVaultSecretSQL = ({
  secret,
  name,
  description,
}: {
  secret: string
  name?: string
  description?: string
}) => {
  const sql = /* SQL */ `
  select vault.create_secret(
      new_secret := ${literal(secret)}
    ${name ? `, new_name := ${literal(name)}` : ''}
    ${description ? `, new_description := ${literal(description)}` : ''}
  )
  `.trim()

  return sql
}

export const getUpdateVaultSecretSQL = ({
  id,
  secret,
  name,
  description,
}: {
  id: string
  secret?: string
  name?: string
  description?: string
}) => {
  const sql = /* SQL */ `
select vault.update_secret(
    secret_id := ${literal(id)}
  ${secret ? `, new_secret := ${literal(secret)}` : ''}
  ${name ? `, new_name := ${literal(name)}` : ''}
  ${description ? `, new_description := ${literal(description)}` : ''}
)
`.trim()
  return sql
}
