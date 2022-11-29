import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { PROJECT_STATUS } from 'lib/constants'
import { ProjectBase } from 'types'
import { checkPermissions } from '../../../hooks'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM } from 'lib/constants'

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
      title: 'Project Settings',
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
        ...(IS_PLATFORM
          ? [
              {
                name: 'Auth',
                key: 'auth',
                url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/auth`,
                items: [],
              },
            ]
          : []),
        ...(IS_PLATFORM
          ? [
              {
                name: 'Storage',
                key: 'storage',
                url: `/project/${ref}/settings/storage`,
                items: [],
              },
            ]
          : []),
      ],
    },
    ...(IS_PLATFORM
      ? [
          {
            title: 'Billing',
            items: [
              {
                name: 'Subscription',
                key: 'subscription',
                url: isProjectBuilding
                  ? buildingUrl
                  : `/project/${ref}/settings/billing/subscription`,
                items: [],
              },
              {
                name: 'Usage',
                key: 'usage',
                url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/billing/usage`,
                items: [],
              },
              {
                name: 'Invoices',
                key: 'invoices',
                url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/billing/invoices`,
                items: [],
              },
            ],
          },
        ]
      : []),
  ]
}
