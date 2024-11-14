import {
  PRODUCT_INTEGRATION_NAMES,
  PRODUCT_INTEGRATIONS,
  PRODUCT_SHORTNAMES,
} from 'shared-data/products'
import { ProductType } from './MainProducts'

const IntegrationsProducts: ProductType = {
  [PRODUCT_SHORTNAMES.VECTOR]: {
    name: PRODUCT_INTEGRATION_NAMES.VECTOR,
    icon: PRODUCT_INTEGRATIONS.vector.icon[24],
    description: (
      <>
        Integrate your favorite ML-models to{' '}
        <strong>store, index and search vector embeddings</strong>.
      </>
    ),
    description_short: 'AI toolkit to manage embeddings',
    label: '',
    url: '/product/integrations/vector',
  },
  cron_jobs: {
    name: PRODUCT_INTEGRATION_NAMES.CRON_JOBS,
    icon: PRODUCT_INTEGRATIONS['cron-jobs'].icon[24],
    description: (
      <>
        Integrate your favorite ML-models to{' '}
        <strong>store, index and search vector embeddings</strong>.
      </>
    ),
    description_short: 'Schedule, manage and monitor jobs',
    label: '',
    url: '/product/integrations/cron-jobs',
  },
  queues: {
    name: PRODUCT_INTEGRATION_NAMES.QUEUES,
    icon: PRODUCT_INTEGRATIONS.queues.icon[24],
    description: (
      <>
        Native Postgres queuing solution for dedicated message queues with the simplicity of SQL and
        zero additional infrastructure
      </>
    ),
    description_short: 'Native pull queues without headache',
    label: '',
    url: '/product/integrations/queues',
  },
}

export default IntegrationsProducts
