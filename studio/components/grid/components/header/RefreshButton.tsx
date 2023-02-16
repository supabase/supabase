import { FC, useState, useEffect } from 'react'
import { Button, IconRefreshCw, IconCheck } from 'ui'
import { SupabaseGridQueue } from '../../constants'
import { Filter, Sort } from 'components/grid/types'
import { useDispatch, useTrackedState } from 'components/grid/store'
import { fetchCount, fetchPage } from 'components/grid/utils'

interface Props {
  sorts: Sort[]
  filters: Filter[]
}

const RefreshButton: FC<Props> = ({ sorts, filters }) => {
  const state = useTrackedState()
  const dispatch = useDispatch()

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
    await fetchCount(state, dispatch, filters)
    await fetchPage(state, dispatch, sorts, filters)
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
