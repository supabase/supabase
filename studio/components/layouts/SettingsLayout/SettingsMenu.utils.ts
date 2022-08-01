import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { PROJECT_STATUS } from 'lib/constants'
import { ProjectBase } from 'types'
import { checkPermissions } from '../../../hooks'
import { PermissionAction } from '@supabase/shared-types/out/constants'

export const generateSettingsMenu = (ref: string, project?: ProjectBase): ProductMenuGroup[] => {
  const isProjectBuilding = project?.status !== PROJECT_STATUS.ACTIVE_HEALTHY
  const buildingUrl = `/project/${ref}/building`

  const canReadStorage = checkPermissions(PermissionAction.STORAGE_ADMIN_READ, '*')
  const canReadInvoices = checkPermissions(PermissionAction.BILLING_READ, 'stripe.invoices')
  const canReadSubscriptions = checkPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )

  return [
    {
      title: 'Project settings',
      items: [
        {
          name: 'General',
          key: 'general',
          url: `/project/${ref}/settings/general`,
          items: [],
        },
        {
          name: 'Database',
          key: 'database',
          url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/database`,
          items: [],
        },
        {
          name: 'API',
          key: 'api',
          url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/api`,
          items: [],
        },
        {
          name: 'Authentication',
          key: 'auth',
          url: isProjectBuilding ? buildingUrl : `/project/${ref}/auth/settings`,
          items: [],
        },
        {
          name: 'Storage',
          key: 'storage',
          url: isProjectBuilding ? buildingUrl : `/project/${ref}/storage/settings`,
          items: [],
          // disabled: canReadStorage,
        },
        {
          name: 'Billing & Usage',
          key: 'billing',
          url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/billing`,
          items: [],
          // disabled: canReadInvoices && canReadSubscriptions,
        },
      ],
    },
  ]
}
