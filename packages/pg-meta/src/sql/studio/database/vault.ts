import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getCreateVaultSecretSQL = ({
  secret,
  name,
  description,
}: {
  secret: string
  name?: string
  description?: string
}): SafeSqlFragment => {
  const namePart = name ? safeSql`, new_name := ${literal(name)}` : safeSql``
  const descriptionPart = description
    ? safeSql`, new_description := ${literal(description)}`
    : safeSql``
  return safeSql`select vault.create_secret(
    new_secret := ${literal(secret)}${namePart}${descriptionPart}
  )`
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
}): SafeSqlFragment => {
  const secretPart = secret ? safeSql`, new_secret := ${literal(secret)}` : safeSql``
  const namePart = name ? safeSql`, new_name := ${literal(name)}` : safeSql``
  const descriptionPart = description
    ? safeSql`, new_description := ${literal(description)}`
    : safeSql``
  return safeSql`select vault.update_secret(
    secret_id := ${literal(id)}${secretPart}${namePart}${descriptionPart}
  )`
}
