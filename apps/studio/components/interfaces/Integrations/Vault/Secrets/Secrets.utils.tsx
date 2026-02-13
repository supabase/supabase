import type { Column } from 'react-data-grid'
import type { VaultSecret } from 'types'
import { cn } from 'ui'

import { SecretRow } from './SecretRow'
import { SecretTableColumn } from './Secrets.types'

export const SECRET_TABLE_COLUMNS: SecretTableColumn[] = [
  { id: 'secret', name: 'Secret', minWidth: 300, width: 360 },
  { id: 'id', name: 'ID', minWidth: 220, width: 260 },
  { id: 'secret_value', name: 'Value', minWidth: 320, width: 420 },
  { id: 'updated_at', name: 'Last updated', minWidth: 180 },
  { id: 'actions', name: '', minWidth: 75, width: 75 },
]

export const formatSecretColumns = (): Column<VaultSecret>[] => {
  return SECRET_TABLE_COLUMNS.map((col) => {
    const result: Column<VaultSecret> = {
      key: col.id,
      name: col.name,
      minWidth: col.minWidth ?? 100,
      maxWidth: col.maxWidth,
      width: col.width,
      resizable: false,
      sortable: false,
      draggable: false,
      headerCellClass: undefined,
      renderHeaderCell: () => {
        return (
          <div
            className={cn(
              'flex items-center justify-between font-normal text-xs w-full',
              col.id === 'secret' && 'ml-8'
            )}
          >
            <p className="!text-foreground">{col.name}</p>
          </div>
        )
      },
      renderCell: ({ row }) => <SecretRow row={row} col={col} />,
    }
    return result
  })
}
