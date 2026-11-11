import type { FlowDestination } from '../DestinationPanel/DestinationPanel.types'

export const PIPELINE_CREATION_STEPS = [
  {
    id: 'destination',
    label: 'Destination',
    title: 'Choose a destination',
    description: () => 'Where should this database be replicated?',
  },
  {
    id: 'connection',
    label: 'Connection',
    title: 'Authorize the destination',
    description: (destination: FlowDestination) =>
      `Name this pipeline and enter credentials for ${destination}.`,
  },
  {
    id: 'data',
    label: 'Data',
    title: 'Choose what to replicate',
    description: () => 'Select a publication and which existing rows to copy during initial sync.',
  },
  {
    id: 'review',
    label: 'Review',
    title: 'Review and create',
    description: () => 'Check these details, then start the pipeline.',
  },
] satisfies [unknown, ...unknown[]]
