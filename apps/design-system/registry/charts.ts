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
]
