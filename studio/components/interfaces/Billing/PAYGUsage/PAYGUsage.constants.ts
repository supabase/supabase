import { ChargeableProduct } from './PAYGUsage.types'

export const chargeableProducts: ChargeableProduct[] = [
  {
    title: 'Database',
    iconUrl: '/img/database.svg',
    features: [
      {
        title: 'Database Size',
        attribute: 'total_db_size_bytes',
        costPerUnit: 0.125,
        unitQuantity: 1000000000, // 1GB
        pricingModel: 'max',
        freeQuota: 8000000000, // 8GB
      },
      {
        title: 'Database Egress',
        attribute: 'total_egress_modified',
        costPerUnit: 0.09,
        unitQuantity: 1000000000, // 1GB
        pricingModel: 'sum',
        freeQuota: 50000000000, // 50GB
      },
    ],
  },
  {
    title: 'Storage',
    iconUrl: '/img/archive.svg',
    features: [
      {
        title: 'Storage Size',
        attribute: 'total_storage_size_bytes',
        costPerUnit: 0.021,
        unitQuantity: 1000000000, // 1GB
        pricingModel: 'max',
        freeQuota: 100000000000, // 100GB
      },
      {
        title: 'Storage Egress',
        attribute: 'total_storage_egress',
        costPerUnit: 0.09,
        unitQuantity: 1000000000, // 1GB
        pricingModel: 'sum',
        freeQuota: 200000000000, // 200GB
      },
    ],
  },
]
