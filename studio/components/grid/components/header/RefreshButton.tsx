import * as React from 'react'
import { Button, IconRefreshCw } from '@supabase/ui'
import { useDispatch, useTrackedState } from '../../store'
import { fetchCount, fetchPage } from '../../utils'

type RefreshButtonProps = {}

const RefreshButton: React.FC<RefreshButtonProps> = ({}) => {
  const [loading, setLoading] = React.useState(false)
  const state = useTrackedState()
  const dispatch = useDispatch()

  async function onClick() {
    setLoading(true)
    await fetchCount(state, dispatch)
    await fetchPage(state, dispatch)
    setLoading(false)
  }

  return (
    <Button
      type="text"
      // style={{ padding: '4px 8px' }}
      icon={
        <div className="text-scale-900">
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
