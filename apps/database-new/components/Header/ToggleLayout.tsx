import { useAppStateSnapshot } from '@/lib/state'
import { Columns, Rows } from 'lucide-react'
import { Button } from 'ui'

const ToggleLayout = () => {
  const snap = useAppStateSnapshot()

  function handleToggle() {
    snap.setLayout(snap.layout === 'two-col' ? 'three-col' : 'two-col')
  }

  return (
    <div>
      <Button type="default" onClick={handleToggle}>
        {snap.layout === 'three-col' ? <Columns size={14} /> : <Rows size={14} />}
      </Button>
    </div>
  )
}

export default ToggleLayout
