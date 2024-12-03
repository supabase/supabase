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
  [PRODUCT_MODULES_SHORTNAMES.CRON]: {
    name: PRODUCT_MODULES_NAMES.CRON,
    icon: PRODUCT_MODULES['cron'].icon[24],
    description: (
      <>
        Integrate your favorite ML-models to{' '}
        <strong>store, index and search vector embeddings</strong>.
      </>
    ),
    description_short: 'Schedule and manage recurring Jobs',
    label: '',
    url: '/modules/cron',
  },
}

export default ProductModules
