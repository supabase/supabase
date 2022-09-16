import { FC, useState } from 'react'
import { Button, IconRefreshCw } from '@supabase/ui'
import { Filter, Sort } from 'components/grid/types'
import { useDispatch, useTrackedState } from 'components/grid/store'
import { fetchCount, fetchPage } from 'components/grid/utils'

interface Props {
  sorts: Sort[]
  filters: Filter[]
}

const RefreshButton: FC<Props> = ({ sorts, filters }) => {
  const [loading, setLoading] = useState(false)
  const state = useTrackedState()
  const dispatch = useDispatch()

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
        <div className="text-scale-1000">
          <IconRefreshCw strokeWidth={1.5} />
        </div>
      }
      onClick={onClick}
      loading={loading}
    >
      Refresh
    </Button>
  )
}
export default RefreshButton
