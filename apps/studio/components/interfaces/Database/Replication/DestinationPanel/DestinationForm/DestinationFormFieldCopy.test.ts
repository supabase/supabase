import { expect, it } from 'vitest'

import { getTableSyncSelectionDescription } from './DestinationFormFieldCopy'

it.each<{ mode: 'include_tables' | 'skip_tables'; action: string }>([
  { mode: 'include_tables', action: 'run' },
  { mode: 'skip_tables', action: 'skip' },
])('preserves the $mode selection description', ({ mode, action }) => {
  for (const selectedCount of [0, 2]) {
    expect(getTableSyncSelectionDescription({ mode, selectedCount, tableCount: 2 })).toBe(
      `${selectedCount} of 2 publication tables will ${action} initial sync. Ongoing replication will still include every publication table.`
    )
  }
})
