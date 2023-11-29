import { useAppStateSnapshot } from '@/lib/state'
import { Button } from 'ui'

const ToggleCodeEditorButton = () => {
  const snap = useAppStateSnapshot()
  return (
    <Button type="default" className="w-[85px]" onClick={() => snap.setHideCode(!snap.hideCode)}>
      {snap.hideCode ? 'Show code' : 'Hide code'}
    </Button>
  )
}

export default ToggleCodeEditorButton
