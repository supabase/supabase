import { Organization, ProjectBase } from 'types'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'

export const generateSettingsMenu = (
  ref?: string,
  project?: ProjectBase,
  organization?: Organization,
  features?: { auth?: boolean; edgeFunctions?: boolean; storage?: boolean; billing?: boolean }
): ProductMenuGroup[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}/building`

  const isOrgBilling = !!organization?.subscription_id

  const authEnabled = features?.auth ?? true
  const edgeFunctionsEnabled = features?.edgeFunctions ?? true
  const storageEnabled = features?.storage ?? true
  const billingEnabled = features?.billing ?? true

  if (isOrgBilling) {
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
            name: 'Infrastructure',
            key: 'infrastructure',
            url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/infrastructure`,
            items: [],
          },
          ...(IS_PLATFORM
            ? [
                {
                  name: 'Integrations',
                  key: 'integrations',
                  url: `/project/${ref}/settings/integrations`,
                  items: [],
                },
              ]
            : []),
          ...(billingEnabled
            ? [
                {
                  name: 'Add Ons',
                  key: 'addons',
                  url: `/project/${ref}/settings/addons`,
                  items: [],
                },
              ]
            : []),
          {
            name: 'Vault',
            key: 'vault',
            url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/vault/secrets`,
            items: [],
            label: 'BETA',
          },
        ],
      },
      {
        title: '',
        items: [
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
          ...(IS_PLATFORM && authEnabled
            ? [
                {
                  name: 'Authentication',
                  key: 'auth',
                  url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/auth`,
                  items: [],
                },
              ]
            : []),
          ...(IS_PLATFORM && storageEnabled
            ? [
                {
                  name: 'Storage',
                  key: 'storage',
                  url: `/project/${ref}/settings/storage`,
                  items: [],
                },
              ]
            : []),
          ...(IS_PLATFORM && edgeFunctionsEnabled
            ? [
                {
                  name: 'Edge Functions',
                  key: 'functions',
                  url: `/project/${ref}/settings/functions`,
                  items: [],
                },
              ]
            : []),
        ],
      },

      {
        title: billingEnabled ? 'Billing' : '',
        items: [
          ...(billingEnabled
            ? [
                {
                  name: 'Subscription',
                  key: 'subscription',
                  url: `/org/${organization?.slug}/billing`,
                  items: [],
                },
              ]
            : []),
          {
            name: 'Usage',
            key: 'usage',
            url: `/org/${organization?.slug}/usage?projectRef=${ref}`,
            items: [],
          },
        ],
      },
    ]
  } else {
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
                  name: 'Integrations',
                  key: 'integrations',
                  url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/integrations`,
                  items: [],
                },
              ]
            : []),
          ...(IS_PLATFORM && authEnabled
            ? [
                {
                  name: 'Auth',
                  key: 'auth',
                  url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/auth`,
                  items: [],
                },
              ]
            : []),
          ...(IS_PLATFORM && storageEnabled
            ? [
                {
                  name: 'Storage',
                  key: 'storage',
                  url: `/project/${ref}/settings/storage`,
                  items: [],
                },
              ]
            : []),
          {
            name: 'Vault',
            key: 'vault',
            url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/vault/secrets`,
            items: [],
            label: 'BETA',
          },
        ],
      },
      ...(IS_PLATFORM
        ? [
            {
              title: billingEnabled ? 'Billing' : '',
              items: [
                ...(billingEnabled
                  ? [
                      {
                        name: 'Subscription',
                        key: 'subscription',
                        url: isProjectBuilding
                          ? buildingUrl
                          : `/project/${ref}/settings/billing/subscription`,
                        items: [],
                      },
                    ]
                  : []),
                {
                  name: 'Usage',
                  key: 'usage',
                  url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/billing/usage`,
                  items: [],
                },
                ...(billingEnabled
                  ? [
                      {
                        name: 'Invoices',
                        key: 'invoices',
                        url: isProjectBuilding
                          ? buildingUrl
                          : `/project/${ref}/settings/billing/invoices`,
                        items: [],
                      },
                    ]
                  : []),
              ],
            },
          ]
        : []),
    ]
  }
}
