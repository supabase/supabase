import { Registry } from '@/registry/schema'

export const fragments: Registry = [
  {
    name: 'ConfirmationModal',
    type: 'components:fragment',
    files: ['/Dialogs/ConfirmationModal.tsx'],
    optionalPath: '/Dialogs',
  },
  {
    name: 'TextConfirmModal',
    type: 'components:fragment',
    files: ['/Dialogs/TextConfirmModal.tsx'],
    optionalPath: '/Dialogs',
  },
  {
    name: 'ConfirmDialog',
    type: 'components:fragment',
    files: ['/Dialogs/ConfirmDialog.tsx'],
    optionalPath: '/Dialogs',
  },
  {
    name: 'PageContainer',
    type: 'components:fragment',
    files: ['/PageContainer/index.tsx'],
    optionalPath: '/PageContainer',
  },
  {
    name: 'PageHeader',
    type: 'components:fragment',
    files: ['/PageHeader/index.tsx'],
    optionalPath: '/PageHeader',
  },
  {
    name: 'PageSection',
    type: 'components:fragment',
    files: ['/PageSection/index.tsx'],
    optionalPath: '/PageSection',
  },
]
