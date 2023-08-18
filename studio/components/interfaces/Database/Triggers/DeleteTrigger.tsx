import { observer } from 'mobx-react-lite'
import { useState } from 'react'

import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'
import { useStore } from 'hooks'
import { isResponseOk } from 'lib/common/fetch'

interface DeleteTriggerProps {
  trigger?: any
  visible: boolean
  setVisible: (value: boolean) => void
}

const DeleteTrigger = ({ trigger, visible, setVisible }: DeleteTriggerProps) => {
  const { ui, meta } = useStore()
  const [loading, setLoading] = useState(false)
  const { id, name, schema } = trigger ?? {}

  async function handleDelete() {
    try {
      setLoading(true)
      if (!id) {
        throw Error('Invalid trigger info')
      }
      const response = await meta.triggers.del(id)
      if (!isResponseOk(response)) {
        throw response.error
      } else {
        ui.setNotification({ category: 'success', message: `Successfully removed ${name}` })
        setVisible(false)
      }
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to delete ${name}: ${error.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <TextConfirmModal
      visible={visible}
      onCancel={() => setVisible(!visible)}
      onConfirm={handleDelete}
      title="Delete this trigger"
      loading={loading}
      confirmLabel={`Delete trigger ${name}`}
      confirmPlaceholder="Type in name of trigger"
      confirmString={name}
      text={`This will delete your trigger called ${name} of schema ${schema}.`}
      alert="You cannot recover this trigger once it is deleted!"
    />
  )
}

export default observer(DeleteTrigger)
