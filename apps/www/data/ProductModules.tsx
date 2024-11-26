import {
  PRODUCT_MODULES_NAMES,
  PRODUCT_MODULES,
  PRODUCT_MODULES_SHORTNAMES,
} from 'shared-data/products'
import { ProductType } from './MainProducts'

const ProductModules: ProductType = {
  [PRODUCT_MODULES_SHORTNAMES.VECTOR]: {
    name: PRODUCT_MODULES_NAMES.VECTOR,
    icon: PRODUCT_MODULES.vector.icon[24],
    description: (
      <>
        Integrate your favorite ML-models to{' '}
        <strong>store, index and search vector embeddings</strong>.
      </>
    ),
    description_short: 'AI toolkit to manage embeddings',
    label: '',
    url: '/modules/vector',
  },
  [PRODUCT_MODULES_SHORTNAMES.CRON_JOBS]: {
    name: PRODUCT_MODULES_NAMES.CRON_JOBS,
    icon: PRODUCT_MODULES['cron-jobs'].icon[24],
    description: (
      <>
        Integrate your favorite ML-models to{' '}
        <strong>store, index and search vector embeddings</strong>.
      </>
    ),
    description_short: 'Schedule, manage and monitor jobs',
    label: '',
    url: '/modules/cron-jobs',
  },
}

export default ProductModules
