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
      },
      {
        title: 'Database Egress',
        attribute: 'total_db_egress_bytes',
        costPerUnit: 0.09,
        unitQuantity: 1000000000, // 1GB
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
      },
      {
        title: 'Storage Egress',
        attribute: 'total_storage_egress',
        costPerUnit: 0.09,
        unitQuantity: 1000000000, // 1GB
      },
    ],
  },
]
