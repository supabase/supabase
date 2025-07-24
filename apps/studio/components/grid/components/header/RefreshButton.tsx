import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'

import { useParams } from 'common'
import { tableRowKeys } from 'data/table-rows/keys'
import { Button } from 'ui'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'

export type RefreshButtonProps = {
  tableId?: number
  isRefetching?: boolean
}

const RefreshButton = ({ tableId, isRefetching }: RefreshButtonProps) => {
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
      icon={<RefreshCw strokeWidth={1.5} />}
      onClick={() => onClick()}
      className="w-7 h-7 p-0"
      tooltip={{
        content: {
          side: 'bottom',
          text: 'Refresh the table data',
        },
      }}
    />
  )
}
export default RefreshButton
