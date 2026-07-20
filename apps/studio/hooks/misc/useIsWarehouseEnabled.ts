import { useFlag } from 'common'

import { useSelectedOrganizationQuery } from './useSelectedOrganization'

/**
 * Whether the Warehouse product is enabled for the current session.
 *
 * Gates every Warehouse surface while in preview: the table Storage section ("Copy to Warehouse"),
 * the per-table storage chips/badges, the Warehouse Catalog integration, and the Connect-sheet
 * catalog tab. Backed by the `warehouse` ConfigCat flag, configured as a comma-separated
 * organization slug allowlist. Use `all` to enable every organization.
 */
export function useIsWarehouseEnabled(): boolean {
  const flagValue = useFlag<string>('warehouse')
  const { data: organization } = useSelectedOrganizationQuery()

  const allowedOrgSlugs =
    typeof flagValue === 'string' ? flagValue.split(',').map((slug) => slug.trim()) : []

  if (allowedOrgSlugs.includes('all')) return true

  return allowedOrgSlugs.includes(organization?.slug ?? '')
}
