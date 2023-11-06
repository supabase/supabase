import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common/hooks'
import { SupaTable } from 'components/grid/types'
import { sqlKeys } from 'data/sql/keys'
import { useEffect, useState } from 'react'
import { Button, IconCheck, IconRefreshCw } from 'ui'
import { SupabaseGridQueue } from '../../constants'

export type RefreshButtonProps = {
  table: SupaTable
  isRefetching: boolean
}

const RefreshButton = ({ table, isRefetching }: RefreshButtonProps) => {
  const { ref } = useParams()
  const queryClient = useQueryClient()

  const queryKey = sqlKeys.query(ref, [table.schema, table.name])
  const [status, setStatus] = useState<string>()

  useEffect(() => {
    let isMounted = true
    let timer: number | null

    SupabaseGridQueue.on('active', () => {
      if (timer) clearTimeout(timer)

      if (isMounted) setStatus('saving')
    })
    SupabaseGridQueue.on('idle', () => {
      if (timer) clearTimeout(timer)
      timer = window.setTimeout(() => setStatus(undefined), 2000)

      if (isMounted) setStatus('saved')
    })

    return () => {
      isMounted = false
      if (timer) clearTimeout(timer)
    }
  }, [])

  async function onClick() {
    await queryClient.invalidateQueries(queryKey)
  }

  return (
    <Button
      type="text"
      icon={
        !status ? (
          <IconRefreshCw className="text-foreground-light" strokeWidth={1.5} />
        ) : status === 'saved' ? (
          <IconCheck className="text-brand" strokeWidth={3} />
        ) : (
          <></>
        )
      }
      onClick={() => {
        if (!status) onClick()
      }}
      loading={isRefetching || status === 'saving'}
    >
      {!status ? 'Refresh' : status === 'saved' ? 'Changes saved' : 'Saving changes'}
    </Button>
  )
}
export default RefreshButton
