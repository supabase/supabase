import { useFlag } from 'common'

/**
 * Whether to surface the Postgres Version Upgrade logs page in the legacy logs
 * sidebar. Gated behind the `showPostgresUpgradeLogs` feature flag since the
 * underlying pg_upgrade_logs source isn't scoped by project, so the page
 * returns no results for most users.
 */
export const useShowPostgresUpgradeLogs = () => {
  return useFlag('showPostgresUpgradeLogs')
}
