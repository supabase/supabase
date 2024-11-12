import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'

import { useParams } from 'common'
import type { SupaTable } from 'components/grid/types'
import { Entity } from 'data/table-editor/table-editor-types'
import { tableRowKeys } from 'data/table-rows/keys'
import { Button } from 'ui'

export type RefreshButtonProps = {
  table: Entity | SupaTable
  isRefetching?: boolean
}

const RefreshButton = ({ table, isRefetching }: RefreshButtonProps) => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const queryKey = tableRowKeys.tableRows(ref, { table: { id: table.id } })

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
