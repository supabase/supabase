import { observer } from 'mobx-react-lite'
import { useState } from 'react'

import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'
import { useStore } from 'hooks'
import { isResponseOk } from 'lib/common/fetch'

interface DeleteFunctionProps {
  func?: any
  visible: boolean
  setVisible: (value: boolean) => void
}

const DeleteFunction = ({ func, visible, setVisible }: DeleteFunctionProps) => {
  const { ui, meta } = useStore()
  const [loading, setLoading] = useState(false)
  const { id, name, schema } = func ?? {}

  async function handleDelete() {
    try {
      setLoading(true)
      if (!id) {
        throw Error('Invalid function info')
      }
      const response = await meta.functions.del(id)
      if (!isResponseOk(response)) {
        throw response.error
      } else {
        ui.setNotification({
          category: 'success',
          message: `Successfully removed ${name}`,
        })
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
    <>
      <TextConfirmModal
        visible={visible}
        onCancel={() => setVisible(!visible)}
        onConfirm={handleDelete}
        title="Delete this function"
        loading={loading}
        confirmLabel={`Delete function ${name}`}
        confirmPlaceholder="Type in name of function"
        confirmString={name}
        text={`This will delete your function called ${name} of schema ${schema}.`}
        alert="You cannot recover this function once it is deleted!"
      />
    </>
  )
}

export default observer(DeleteFunction)
