import { ProjectBase } from 'types'
import { useFlag } from 'hooks'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'

export const generateSettingsMenu = (ref: string, project?: ProjectBase): ProductMenuGroup[] => {
  const isVaultEnabled = useFlag('vaultExtension')

  const isProjectBuilding = project?.status !== PROJECT_STATUS.ACTIVE_HEALTHY
  const buildingUrl = `/project/${ref}/building`

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
        ...(isVaultEnabled
          ? [
              {
                name: 'Vault',
                key: 'vault',
                url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/vault/secrets`,
                items: [],
                label: 'BETA',
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
