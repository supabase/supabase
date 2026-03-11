import { components } from 'api-types'
import { PROVIDERS } from 'lib/constants'

export type DesiredInstanceSize = Exclude<
  components['schemas']['CreateProjectBody']['desired_instance_size'],
  undefined | 'pico' | 'nano'
>
export type ReleaseChannel = Exclude<
  components['schemas']['CreateProjectBody']['release_channel'],
  undefined
>
export type PostgresEngine = Exclude<
  components['schemas']['CreateProjectBody']['postgres_engine'],
  undefined
>

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
    cloud_providers: [
      PROVIDERS.AWS.id,
      PROVIDERS.AWS_K8S.id,
      PROVIDERS.AWS_NIMBUS.id,
      PROVIDERS.FLY.id,
    ],
  },
  small: {
    label: 'Small',
    ram: '2 GB',
    cpu: '2-core',
    priceHourly: 0.0206,
    priceMonthly: 15,
    cloud_providers: [
      PROVIDERS.AWS.id,
      PROVIDERS.AWS_K8S.id,
      PROVIDERS.AWS_NIMBUS.id,
      PROVIDERS.FLY.id,
    ],
  },
  medium: {
    label: 'Medium',
    ram: '4 GB',
    cpu: '2-core',
    priceHourly: 0.0822,
    priceMonthly: 60,
    cloud_providers: [
      PROVIDERS.AWS.id,
      PROVIDERS.AWS_K8S.id,
      PROVIDERS.AWS_NIMBUS.id,
      PROVIDERS.FLY.id,
    ],
  },
  large: {
    label: 'Large',
    ram: '8 GB',
    cpu: '2-core',
    priceHourly: 0.1517,
    priceMonthly: 110,
    cloud_providers: [
      PROVIDERS.AWS.id,
      PROVIDERS.AWS_K8S.id,
      PROVIDERS.AWS_NIMBUS.id,
      PROVIDERS.FLY.id,
    ],
  },
  xlarge: {
    label: 'XL',
    ram: '16 GB',
    cpu: '4-core',
    priceHourly: 0.2877,
    priceMonthly: 210,
    cloud_providers: [
      PROVIDERS.AWS.id,
      PROVIDERS.AWS_K8S.id,
      PROVIDERS.AWS_NIMBUS.id,
      PROVIDERS.FLY.id,
    ],
  },
  '2xlarge': {
    label: '2XL',
    ram: '32 GB',
    cpu: '8-core',
    priceHourly: 0.562,
    priceMonthly: 410,
    cloud_providers: [
      PROVIDERS.AWS.id,
      PROVIDERS.AWS_K8S.id,
      PROVIDERS.AWS_NIMBUS.id,
      PROVIDERS.FLY.id,
    ],
  },
  '4xlarge': {
    label: '4XL',
    ram: '64 GB',
    cpu: '16-core',
    priceHourly: 1.32,
    priceMonthly: 960,
    cloud_providers: [
      PROVIDERS.AWS.id,
      PROVIDERS.AWS_K8S.id,
      PROVIDERS.AWS_NIMBUS.id,
      PROVIDERS.FLY.id,
    ],
  },
  '8xlarge': {
    label: '8XL',
    ram: '128 GB',
    cpu: '32-core',
    priceHourly: 2.562,
    priceMonthly: 1870,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.AWS_K8S.id, PROVIDERS.AWS_NIMBUS.id],
  },
  '12xlarge': {
    label: '12XL',
    ram: '192 GB',
    cpu: '48-core',
    priceHourly: 3.836,
    priceMonthly: 2800,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.AWS_K8S.id, PROVIDERS.AWS_NIMBUS.id],
  },
  '16xlarge': {
    label: '16XL',
    ram: '256 GB',
    cpu: '64-core',
    priceHourly: 5.12,
    priceMonthly: 3730,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.AWS_K8S.id, PROVIDERS.AWS_NIMBUS.id],
  },
  '24xlarge': {
    label: '24XL',
    ram: '384 GB',
    cpu: '96-core',
    priceHourly: 9.73,
    priceMonthly: 7100,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.AWS_K8S.id, PROVIDERS.AWS_NIMBUS.id],
  },
  '24xlarge_optimized_cpu': {
    label: '24XL - Optimized CPU',
    ram: '192 GB',
    cpu: '96-core',
    priceHourly: 8.9,
    priceMonthly: 6500,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.AWS_K8S.id, PROVIDERS.AWS_NIMBUS.id],
  },
  '24xlarge_optimized_memory': {
    label: '24XL - Optimized Memory',
    ram: '768 GB',
    cpu: '96-core',
    priceHourly: 13.84,
    priceMonthly: 10100,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.AWS_K8S.id, PROVIDERS.AWS_NIMBUS.id],
  },
  '24xlarge_high_memory': {
    label: '24XL - High Memory',
    ram: '1536 GB',
    cpu: '96-core',
    priceHourly: 21.91,
    priceMonthly: 16000,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.AWS_K8S.id, PROVIDERS.AWS_NIMBUS.id],
  },
  '48xlarge': {
    label: '48XL',
    ram: '768 GB',
    cpu: '192-core',
    priceHourly: 19.47,
    priceMonthly: 14200,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.AWS_K8S.id, PROVIDERS.AWS_NIMBUS.id],
  },
  '48xlarge_optimized_cpu': {
    label: '48XL - Optimized CPU',
    ram: '384 GB',
    cpu: '192-core',
    priceHourly: 17.8,
    priceMonthly: 13000,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.AWS_K8S.id, PROVIDERS.AWS_NIMBUS.id],
  },
  '48xlarge_optimized_memory': {
    label: '48XL - Optimized Memory',
    ram: '1536 GB',
    cpu: '192-core',
    priceHourly: 27.68,
    priceMonthly: 20200,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.AWS_K8S.id, PROVIDERS.AWS_NIMBUS.id],
  },
  '48xlarge_high_memory': {
    label: '48XL - High Memory',
    ram: '3072 GB',
    cpu: '192-core',
    priceHourly: 43.84,
    priceMonthly: 32000,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.AWS_K8S.id, PROVIDERS.AWS_NIMBUS.id],
  },
}
