import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { tableRowKeys } from 'data/table-rows/keys'

export type RefreshButtonProps = {
  tableId?: number
  isRefetching?: boolean
}

export const RefreshButton = ({ tableId, isRefetching }: RefreshButtonProps) => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const queryKey = tableRowKeys.tableRowsAndCount(ref, tableId)

  async function onClick() {
    await queryClient.invalidateQueries(queryKey)
  }

  return (
    <ButtonTooltip
      type="outline"
      loading={isRefetching}
      icon={<RefreshCw />}
      onClick={() => onClick()}
      className="w-7 h-7 p-0"
      tooltip={{
        content: {
          side: 'bottom',
          text: 'Refresh table data',
        },
      }}
    />
  )
}
