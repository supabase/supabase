import { Registry } from './schema'

export const charts: Registry = [
  {
    name: 'chart-bar-interactive',
    type: 'components:block',
    registryDependencies: ['card', 'chart'],
    files: ['block/chart-bar-interactive.tsx'],
    category: 'Charts',
    subcategory: 'Bar',
  },
  {
    name: 'chart-composed-demo',
    type: 'components:block',
    registryDependencies: ['chart'],
    files: ['block/chart-composed-demo.tsx'],
    category: 'Charts',
    subcategory: 'Composed',
  },
]
