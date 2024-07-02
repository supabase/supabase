import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'

import { useParams } from 'common'
import type { SupaTable } from 'components/grid/types'
import { sqlKeys } from 'data/sql/keys'
import type { TableLike } from 'hooks/misc/useTable'
import { Button } from 'ui'

export type RefreshButtonProps = {
  table: TableLike | SupaTable
  isRefetching?: boolean
}

const RefreshButton = ({ table, isRefetching }: RefreshButtonProps) => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const queryKey = sqlKeys.query(ref, [table.schema, table.name])

  async function onClick() {
    await queryClient.invalidateQueries(queryKey)
  }

  return (
    <Button
      type="text"
      loading={isRefetching}
      icon={<RefreshCw className="text-foreground-muted" strokeWidth={1.5} />}
      onClick={() => onClick()}
    >
      Refresh
    </Button>
  )
}
export default RefreshButton
