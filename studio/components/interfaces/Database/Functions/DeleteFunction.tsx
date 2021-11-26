import { FC, useState } from 'react'
import toast from 'react-hot-toast'
import { observer } from 'mobx-react-lite'
import { useStore } from 'hooks'
import TextConfirmModal from 'components/to-be-cleaned/ModalsDeprecated/TextConfirmModal'

type DeleteFunctionProps = {
  func?: any
  visible: boolean
  setVisible: (value: boolean) => void
} & any

const DeleteFunction: FC<DeleteFunctionProps> = ({ func, visible, setVisible }) => {
  const { meta } = useStore()
  const [loading, setLoading] = useState(false)
  const { id, name, schema } = func ?? {}

  async function handleDelete() {
    try {
      setLoading(true)
      if (!id) {
        throw Error('Invalid function info')
      }
      const response: any = await meta.functions.del(id)
      if (response.error) {
        throw response.error
      } else {
        toast.success(`Function ${name} removed`)
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
