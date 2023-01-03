import { SubscriptionAddon } from './AddOns.types'

export const getSemanticVersion = (version: string) => {
  if (!version) return 0

  // e.g supabase-postgres-14.1.0.88
  // There's 4 segments instead so we can't use the semver package
  const segments = version.split('supabase-postgres-')
  const semver = segments[segments.length - 1]

  // e.g supabase-postgres-14.1.0.99-vault-rc1
  const formattedSemver = semver.split('-')[0]

  return Number(formattedSemver.split('.').join(''))
}

export const formatComputeSizes = (addons: SubscriptionAddon[]) => {
  const addonsOrder = [
    'addon_instance_small',
    'addon_instance_medium',
    'addon_instance_large',
    'addon_instance_xlarge',
    'addon_instance_xxlarge',
    'addon_instance_4xlarge',
    'addon_instance_8xlarge',
    'addon_instance_12xlarge',
    'addon_instance_16xlarge',
  ]

  const microOption: SubscriptionAddon = {
    id: undefined,
    name: 'Micro Add-on',
    metadata: {
      default_price_id: undefined,
      supabase_prod_id: 'addon_instance_micro',
      features: '2-core ARM (shared) • 1GB memory • 2,606Mbps Disk IO',
    },
    prices: [
      {
        id: undefined,
        currency: 'usd',
        recurring: {
          interval: 'month',
          usage_type: 'licensed',
          interval_count: 1,
          aggregate_usage: null,
          trial_period_days: null,
        },
        unit_amount: 0,
      },
    ],
  }

  return [microOption]
    .concat(
      addonsOrder.map((id: string) => {
        return addons.find((option) => option.metadata.supabase_prod_id === id)
      }) as SubscriptionAddon[]
    )
    .filter((option) => option !== undefined)
}

export const formatPITROptions = (addons: SubscriptionAddon[]) => {
  const pitrOrder = ['addon_pitr_7days', 'addon_pitr_14days', 'addon_pitr_28days']

  const noPITROption: SubscriptionAddon = {
    id: undefined,
    name: 'Disable PITR',
    metadata: {
      default_price_id: undefined,
      supabase_prod_id: 'addon_pitr_0days',
      features: '',
    },
    prices: [
      {
        id: undefined,
        currency: 'usd',
        recurring: {
          interval: 'month',
          usage_type: 'licensed',
          interval_count: 1,
          aggregate_usage: null,
          trial_period_days: null,
        },
        unit_amount: 0,
      },
    ],
  }

  const pitrOptions = pitrOrder
    .map((id: string) => {
      return addons.find((option) => option.metadata.supabase_prod_id === id)
    })
    .filter((option) => option !== undefined) as SubscriptionAddon[]

  if (pitrOptions.length === 0) return []
  else return [noPITROption].concat(pitrOptions)
}

export const formatCustomDomainOptions = (addons: SubscriptionAddon[]) => {
  const customDomainOrder = ['addon_custom_domains']
  const noCustomDomainOption: SubscriptionAddon = {
    id: undefined,
    name: 'Disable Custom Domains',
    metadata: {
      default_price_id: undefined,
      supabase_prod_id: 'addon_custom_domains_disabled',
      features: '',
    },
    prices: [
      {
        id: undefined,
        currency: 'usd',
        recurring: {
          interval: 'month',
          usage_type: 'licensed',
          interval_count: 1,
          aggregate_usage: null,
          trial_period_days: null,
        },
        unit_amount: 0,
      },
    ],
  }

  const customDomainOptions = customDomainOrder
    .map((id: string) => {
      return addons.find((option) => option.metadata.supabase_prod_id === id)
    })
    .filter((option) => option !== undefined) as SubscriptionAddon[]

  if (customDomainOptions.length === 0) return []
  else return [noCustomDomainOption].concat(customDomainOptions)
}
