import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { RefreshCw } from 'lucide-react'
import { Button } from 'ui'

import { useTableIndexAdvisor } from '@/components/grid/context/TableIndexAdvisorContext'
import { Shortcut } from '@/components/ui/Shortcut'
import { tableRowKeys } from '@/data/table-rows/keys'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

export type RefreshButtonProps = {
  tableId?: number
  isRefetching?: boolean
}

export const RefreshButton = ({ tableId, isRefetching }: RefreshButtonProps) => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const { invalidate: invalidateIndexAdvisor } = useTableIndexAdvisor()
  const queryKey = tableRowKeys.tableRowsAndCount(ref, tableId)

  async function onClick() {
    await queryClient.invalidateQueries({ queryKey })
    await invalidateIndexAdvisor()
  }

  return (
    <Shortcut
      id={SHORTCUT_IDS.TABLE_EDITOR_REFRESH}
      onTrigger={onClick}
      options={{ registerInCommandMenu: true }}
      side="bottom"
    >
      <Button
        type="outline"
        loading={isRefetching}
        icon={<RefreshCw />}
        onClick={() => onClick()}
        className="w-7 p-0"
      />
    </Shortcut>
  )
}
