import { useQueryClient } from '@tanstack/react-query'
import { SupaTable } from 'components/grid/types'
import { sqlKeys } from 'data/sql/keys'
import { useEffect, useState } from 'react'
import { Button, IconCheck, IconRefreshCw } from 'ui'
import { SupabaseGridQueue } from '../../constants'

export type RefreshButtonProps = {
  projectRef?: string
  table: SupaTable
}

const RefreshButton = ({ projectRef, table }: RefreshButtonProps) => {
  const queryClient = useQueryClient()

  const [loading, setLoading] = useState(false)
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
    setLoading(true)
    await queryClient.invalidateQueries(sqlKeys.query(projectRef, [table.schema, table.name]))
    setLoading(false)
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
