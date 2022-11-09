import { DatabaseAddon } from './AddOns.types'

// e.g supabase-postgres-14.1.0.88 (There's 4 segments instead, so we can't use semver)
export const getSemanticVersion = (version: string) => {
  if (!version) return 0

  const segments = version.split('-')
  const semver = segments[segments.length - 1]
  return Number(semver.split('.').join(''))
}

export const formatComputeSizes = (addons: DatabaseAddon[]) => {
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

  const microOption: DatabaseAddon = {
    id: undefined,
    name: 'Micro Add-on',
    metadata: {
      default_price_id: undefined,
      supabase_prod_id: 'addon_instance_micro',
      features: '2 CPUs • 1GB memory • 2,085Mbps Disk IO',
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
      }) as DatabaseAddon[]
    )
    .filter((option) => option !== undefined)
}

export const formatPITROptions = (addons: DatabaseAddon[]) => {
  const pitrOrder = ['addon_pitr_7days', 'addon_pitr_14days', 'addon_pitr_28days']

  const noPITROption: DatabaseAddon = {
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

  return [noPITROption]
    .concat(
      pitrOrder.map((id: string) => {
        return addons.find((option) => option.metadata.supabase_prod_id === id)
      }) as DatabaseAddon[]
    )
    .filter((option) => option !== undefined)
}
