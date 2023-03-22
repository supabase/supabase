import { useQueryClient, useIsFetching } from '@tanstack/react-query'
import { SupaTable } from 'components/grid/types'
import { sqlKeys } from 'data/sql/keys'
import { useParams } from 'hooks'
import { useEffect, useState } from 'react'
import { Button, IconCheck, IconRefreshCw } from 'ui'
import { SupabaseGridQueue } from '../../constants'

export type RefreshButtonProps = {
  table: SupaTable
}

const RefreshButton = ({ table }: RefreshButtonProps) => {
  const { ref } = useParams()
  const queryClient = useQueryClient()

  const queryKey = sqlKeys.query(ref, [table.schema, table.name])

  const loading = useIsFetching({ queryKey }) > 0

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
          <IconRefreshCw className="text-scale-1000" strokeWidth={1.5} />
        ) : status === 'saved' ? (
          <IconCheck className="text-brand-900" strokeWidth={3} />
        ) : (
          <></>
        )
      }
      onClick={() => {
        if (!status) onClick()
      }}
      loading={loading || status === 'saving'}
    >
      {!status ? 'Refresh' : status === 'saved' ? 'Changes saved' : 'Saving changes'}
    </Button>
  )
}
export default RefreshButton
