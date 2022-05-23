import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from 'hooks'
import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'

type DeleteHookProps = {
  hook?: any
  visible: boolean
  setVisible: (value: boolean) => void
} & any

const DeleteHook: React.FC<DeleteHookProps> = ({ hook, visible, setVisible }) => {
  const { ui, meta } = useStore()
  const [loading, setLoading] = React.useState(false)
  const { id, name, schema } = hook ?? {}

  async function handleDelete() {
    try {
      setLoading(true)
      if (!id) {
        throw Error('Invalid hook info')
      }
      const response: any = await meta.hooks.del(id)
      if (response.error) {
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
      title="Delete this hook"
      loading={loading}
      confirmLabel={`Delete hook ${name}`}
      confirmPlaceholder="Type in name of hook"
      confirmString={name}
      text={`This will delete your hook called ${name} of schema ${schema}.`}
      alert="You cannot recover this hook once it is deleted!"
    />
  )
}

export default observer(DeleteHook)
