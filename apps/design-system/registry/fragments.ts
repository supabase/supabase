import { Registry } from '@/registry/schema'

export const fragments: Registry = [
  {
    name: 'ConfirmationModal',
    type: 'components:fragment',
    files: ['/Dialogs/ConfirmationModal.tsx'],
    optionalPath: '/Dialogs',
  },
  {
    name: 'EmptyStatePresentational',
    type: 'components:fragment',
    files: ['/EmptyStatePresentational/index.tsx'],
    optionalPath: '/EmptyStatePresentational',
  },
  {
    name: 'TextConfirmModal',
    type: 'components:fragment',
    files: ['/Dialogs/TextConfirmModal.tsx'],
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
  {
    name: 'StatusCode',
    type: 'components:fragment',
    files: ['/StatusCode/index.tsx'],
    optionalPath: '/StatusCode',
  },
]
