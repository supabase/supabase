export const DB_PASSWORD_PLACEHOLDER = '[YOUR-PASSWORD]'

export function buildDirectPostgresConnectionUri(settings: {
  db_user: string
  db_host: string
  db_port: number
  db_name: string
}): string {
  return `postgresql://${settings.db_user}:${DB_PASSWORD_PLACEHOLDER}@${settings.db_host}:${settings.db_port}/${settings.db_name}`
}

export function buildLogicalBackupShellScript(connectionUri: string): string {
  return [
    `npx supabase db dump --db-url '${connectionUri}' -f roles.sql --role-only`,
    `npx supabase db dump --db-url '${connectionUri}' -f schema.sql`,
    `npx supabase db dump --db-url '${connectionUri}' -f data.sql --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"`,
  ].join('\n')
}
