import { FC } from 'react'
import { Button } from '@supabase/ui'
import { PostgresTable } from '@supabase/postgres-meta'
import { checkPermissions, useStore } from 'hooks'
import { PermissionAction } from '@supabase/shared-types/out/constants'

interface Props {
  selectedSchema: string
  onAddTable: () => void
}

const EmptyState: FC<Props> = ({ selectedSchema, onAddTable }) => {
  const { meta } = useStore()
  const tables = meta.tables.list((table: PostgresTable) => table.schema === selectedSchema)

  const renderNoTablesCTA = () => {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <p className="text-sm">There are no tables available in this schema</p>
        {selectedSchema === 'public' && <Button onClick={onAddTable}>Create a new table</Button>}
      </div>
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      {tables.length === 0 ? (
        renderNoTablesCTA()
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <p className="text-sm">Select a table or create a new one</p>
          <Button onClick={onAddTable}>Create a new table</Button>
        </div>
      )}
    </div>
  )
}

export default EmptyState
