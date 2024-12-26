import { components } from 'api-types'
import { PROVIDERS } from 'lib/constants'

type DesiredInstanceSize = components['schemas']['DesiredInstanceSize']

export const instanceSizeSpecs: Record<
  DesiredInstanceSize,
  {
    label: string
    ram: string
    cpu: string
    priceHourly: number
    priceMonthly: number
    cloud_providers: string[]
  }
> = {
  micro: {
    label: 'Micro',
    ram: '1 GB',
    cpu: '2-core',
    priceHourly: 0.01344,
    priceMonthly: 10,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.FLY.id],
  },
  small: {
    label: 'Small',
    ram: '2 GB',
    cpu: '2-core',
    priceHourly: 0.0206,
    priceMonthly: 15,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.FLY.id],
  },
  medium: {
    label: 'Medium',
    ram: '4 GB',
    cpu: '2-core',
    priceHourly: 0.0822,
    priceMonthly: 60,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.FLY.id],
  },
  large: {
    label: 'Large',
    ram: '8 GB',
    cpu: '2-core',
    priceHourly: 0.1517,
    priceMonthly: 110,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.FLY.id],
  },
  xlarge: {
    label: 'XL',
    ram: '16 GB',
    cpu: '4-core',
    priceHourly: 0.2877,
    priceMonthly: 210,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.FLY.id],
  },
  '2xlarge': {
    label: '2XL',
    ram: '32 GB',
    cpu: '8-core',
    priceHourly: 0.562,
    priceMonthly: 410,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.FLY.id],
  },
  '4xlarge': {
    label: '4XL',
    ram: '64 GB',
    cpu: '16-core',
    priceHourly: 1.32,
    priceMonthly: 960,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.FLY.id],
  },
  '8xlarge': {
    label: '8XL',
    ram: '128 GB',
    cpu: '32-core',
    priceHourly: 2.562,
    priceMonthly: 1870,
    cloud_providers: [PROVIDERS.AWS.id],
  },
  '12xlarge': {
    label: '12XL',
    ram: '192 GB',
    cpu: '48-core',
    priceHourly: 3.836,
    priceMonthly: 2800,
    cloud_providers: [PROVIDERS.AWS.id],
  },
  '16xlarge': {
    label: '16XL',
    ram: '256 GB',
    cpu: '64-core',
    priceHourly: 5.12,
    priceMonthly: 3730,
    cloud_providers: [PROVIDERS.AWS.id],
  },
}
