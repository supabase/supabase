import { products } from 'shared-data'
import { PRODUCT_NAMES, PRODUCT_SHORTNAMES } from 'shared-data/products'

const solutions = {
  [PRODUCT_SHORTNAMES.DATABASE]: {
    name: PRODUCT_NAMES.DATABASE,
    icon: products.database.icon[24],
    description:
      "Every project is a full Postgres database, the world's most trusted relational database.",
    description_short: 'Fully portable Postgres database',
    label: '',
    url: '/database',
  },
  [PRODUCT_SHORTNAMES.AUTHENTICATION]: {
    name: PRODUCT_NAMES.AUTHENTICATION,
    icon: products.authentication.icon[24],
    description: 'Add user sign ups and logins, securing your data with Row Level Security.',
    description_short: 'User Management out of the box',
    label: '',
    url: '/auth',
  },
  [PRODUCT_SHORTNAMES.STORAGE]: {
    name: PRODUCT_NAMES.STORAGE,
    icon: products.storage.icon[24],
    description: 'Store, organize, and serve large files. Any media, including videos and images.',
    description_short: 'Serverless storage for any media',
    label: '',
    url: '/storage',
  },
  [PRODUCT_SHORTNAMES.FUNCTIONS]: {
    name: PRODUCT_NAMES.FUNCTIONS,
    icon: products.functions.icon[24],
    description: 'Write custom code without deploying or scaling servers.',
    description_short: 'Deploy code globally on the edge',
    label: '',
    url: '/edge-functions',
  },
  [PRODUCT_SHORTNAMES.REALTIME]: {
    name: PRODUCT_NAMES.REALTIME,
    icon: products.realtime.icon[24],
    description:
      'Create multiplayer experiences by sharing, broadcasting, and listening to changes from other clients or the Database.',
    description_short: 'Synchronize and broadcast events',
    label: '',
    url: '/realtime',
  },
  [PRODUCT_SHORTNAMES.VECTOR]: {
    name: PRODUCT_NAMES.VECTOR,
    icon: products.vector.icon[24],
    description: 'Integrate your favorite ML-models to store, index and search vector embeddings.',
    description_short: 'AI toolkit to manage embeddings',
    label: '',
    url: '/vector',
  },
}

export default solutions
