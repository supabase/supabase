import { components } from 'api-types'

import { PROVIDERS } from '@/lib/constants'

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

// [console fork] Compute sizes are real EC2 instance types with AWS on-demand
// pricing (us-east-1), not Supabase's abstracted compute add-ons. priceMonthly
// is priceHourly * 730 (approx hours/month), rounded. t4g/m6g = Graviton (ARM);
// the largest tiers use Intel m6i/c6i/r6i/x2 families.
const AWS_ALL = [
  PROVIDERS.AWS.id,
  PROVIDERS.AWS_K8S.id,
  PROVIDERS.AWS_NIMBUS.id,
  PROVIDERS.FLY.id,
]
const AWS_ONLY = [PROVIDERS.AWS.id, PROVIDERS.AWS_K8S.id, PROVIDERS.AWS_NIMBUS.id]

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
    label: 't4g.micro',
    ram: '1 GB',
    cpu: '2 vCPU',
    priceHourly: 0.0084,
    priceMonthly: 6,
    cloud_providers: AWS_ALL,
  },
  small: {
    label: 't4g.small',
    ram: '2 GB',
    cpu: '2 vCPU',
    priceHourly: 0.0168,
    priceMonthly: 12,
    cloud_providers: AWS_ALL,
  },
  medium: {
    label: 't4g.medium',
    ram: '4 GB',
    cpu: '2 vCPU',
    priceHourly: 0.0336,
    priceMonthly: 25,
    cloud_providers: AWS_ALL,
  },
  large: {
    label: 'm6g.large',
    ram: '8 GB',
    cpu: '2 vCPU',
    priceHourly: 0.077,
    priceMonthly: 56,
    cloud_providers: AWS_ALL,
  },
  xlarge: {
    label: 'm6g.xlarge',
    ram: '16 GB',
    cpu: '4 vCPU',
    priceHourly: 0.154,
    priceMonthly: 112,
    cloud_providers: AWS_ALL,
  },
  '2xlarge': {
    label: 'm6g.2xlarge',
    ram: '32 GB',
    cpu: '8 vCPU',
    priceHourly: 0.308,
    priceMonthly: 225,
    cloud_providers: AWS_ALL,
  },
  '4xlarge': {
    label: 'm6g.4xlarge',
    ram: '64 GB',
    cpu: '16 vCPU',
    priceHourly: 0.616,
    priceMonthly: 450,
    cloud_providers: AWS_ALL,
  },
  '8xlarge': {
    label: 'm6g.8xlarge',
    ram: '128 GB',
    cpu: '32 vCPU',
    priceHourly: 1.232,
    priceMonthly: 899,
    cloud_providers: AWS_ONLY,
  },
  '12xlarge': {
    label: 'm6g.12xlarge',
    ram: '192 GB',
    cpu: '48 vCPU',
    priceHourly: 1.848,
    priceMonthly: 1349,
    cloud_providers: AWS_ONLY,
  },
  '16xlarge': {
    label: 'm6g.16xlarge',
    ram: '256 GB',
    cpu: '64 vCPU',
    priceHourly: 2.464,
    priceMonthly: 1799,
    cloud_providers: AWS_ONLY,
  },
  '24xlarge': {
    label: 'm6i.24xlarge',
    ram: '384 GB',
    cpu: '96 vCPU',
    priceHourly: 4.608,
    priceMonthly: 3364,
    cloud_providers: AWS_ONLY,
  },
  '24xlarge_optimized_cpu': {
    label: 'c6i.24xlarge',
    ram: '192 GB',
    cpu: '96 vCPU',
    priceHourly: 4.08,
    priceMonthly: 2978,
    cloud_providers: AWS_ONLY,
  },
  '24xlarge_optimized_memory': {
    label: 'r6i.24xlarge',
    ram: '768 GB',
    cpu: '96 vCPU',
    priceHourly: 6.048,
    priceMonthly: 4415,
    cloud_providers: AWS_ONLY,
  },
  '24xlarge_high_memory': {
    label: 'x2idn.24xlarge',
    ram: '1536 GB',
    cpu: '96 vCPU',
    priceHourly: 10.005,
    priceMonthly: 7304,
    cloud_providers: AWS_ONLY,
  },
  '48xlarge': {
    label: 'm7i.48xlarge',
    ram: '768 GB',
    cpu: '192 vCPU',
    priceHourly: 9.6768,
    priceMonthly: 7064,
    cloud_providers: AWS_ONLY,
  },
  '48xlarge_optimized_cpu': {
    label: 'c7i.48xlarge',
    ram: '384 GB',
    cpu: '192 vCPU',
    priceHourly: 8.568,
    priceMonthly: 6255,
    cloud_providers: AWS_ONLY,
  },
  '48xlarge_optimized_memory': {
    label: 'r7i.48xlarge',
    ram: '1536 GB',
    cpu: '192 vCPU',
    priceHourly: 12.7008,
    priceMonthly: 9272,
    cloud_providers: AWS_ONLY,
  },
  '48xlarge_high_memory': {
    label: 'x2iedn.metal',
    ram: '3072 GB',
    cpu: '192 vCPU',
    priceHourly: 26.68,
    priceMonthly: 19476,
    cloud_providers: AWS_ONLY,
  },
}
