import * as React from 'react'
import toast from 'react-hot-toast'
import { observer } from 'mobx-react-lite'
import { useStore } from 'hooks'
import TextConfirmModal from 'components/to-be-cleaned/ModalsDeprecated/TextConfirmModal'

type DeleteTriggerProps = {
  trigger?: any
  visible: boolean
  setVisible: (value: boolean) => void
} & any

const DeleteTrigger: React.FC<DeleteTriggerProps> = ({ store, trigger, visible, setVisible }) => {
  const { meta } = useStore()
  const [loading, setLoading] = React.useState(false)
  const { id, name, schema } = trigger ?? {}

  async function handleDelete() {
    try {
      setLoading(true)
      if (!id) {
        throw Error('Invalid trigger info')
      }
      const response: any = await meta.triggers.del(id)
      if (response.error) {
        throw response.error
      } else {
        toast.success(`Trigger ${name} removed`)
        setVisible(false)
      }
    } catch (error: any) {
      toast.error(`Deleting ${name} failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
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
    </>
  )
}

export default observer(DeleteTrigger)
