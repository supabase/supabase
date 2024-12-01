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
  [PRODUCT_MODULES_SHORTNAMES.QUEUES]: {
    name: PRODUCT_MODULES_NAMES.QUEUES,
    icon: PRODUCT_MODULES.queues.icon[24],
    description: (
      <>
        Native Postgres queuing solution for dedicated message queues with the simplicity of SQL and
        zero additional infrastructure
      </>
    ),
    description_short: 'Message Queues with guarenteed delivery',
    label: '',
    url: '/modules/queues',
  },
}

export default ProductModules
