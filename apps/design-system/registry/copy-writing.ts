import { Registry } from './schema'

export const copyWriting: Registry = [
  {
    name: 'copy-button-verbs',
    type: 'components:example',
    files: ['example/copy-button-verbs.tsx'],
    registryDependencies: ['button'],
    category: 'Getting Started',
    subcategory: 'Copy Writing',
  },
  {
    name: 'copy-form-labels',
    type: 'components:example',
    files: ['example/copy-form-labels.tsx'],
    registryDependencies: ['form'],
    category: 'Getting Started',
    subcategory: 'Copy Writing',
  },
  {
    name: 'copy-error-messages',
    type: 'components:example',
    files: ['example/copy-error-messages.tsx'],
    registryDependencies: ['form'],
    category: 'Getting Started',
    subcategory: 'Copy Writing',
  },
]
