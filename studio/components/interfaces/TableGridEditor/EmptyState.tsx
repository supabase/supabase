import { FC } from 'react'
import { Button, Typography } from '@supabase/ui'
import { PostgresTable } from '@supabase/postgres-meta'
import { useStore } from 'hooks'

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
        <Typography.Text>There are no tables available in this schema</Typography.Text>
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
          <Typography.Text>Select a table or create a new one</Typography.Text>
          <Button onClick={onAddTable}>Create a new table</Button>
        </div>
      )}
    </div>
  )
}

export default EmptyState
