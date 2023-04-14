import { Portal } from '@radix-ui/react-portal'
import { Button } from 'ui'

interface Props {
  hasChanges: boolean
  onReset: () => void
  onClickSave: () => void
}

function PrivilegesFooter(props: Props) {
  if (!props.hasChanges) {
    return null
  }

  return (
    <Portal className="portal--save-changes">
      <div className="fixed left-1/2 -translate-x-1/2 mb-4 bottom-0 bg-gray-400 text-white p-3 shadow-lg rounded-md">
        <div className="container mx-auto flex gap-16 justify-between items-center">
          <div className="text-sm">You have unsaved changes</div>
          <div className="flex gap-2 items-center">
            <Button type="link" onClick={props.onReset}>
              Reset
            </Button>
            <Button onClick={props.onClickSave}>Save Changes</Button>
          </div>
        </div>
      </div>
    </Portal>
  )
}

export default PrivilegesFooter
