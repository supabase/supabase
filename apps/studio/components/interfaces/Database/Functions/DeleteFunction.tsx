import toast from 'react-hot-toast'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'
import { useDatabaseFunctionDeleteMutation } from 'data/database-functions/database-functions-delete-mutation'

interface DeleteFunctionProps {
  func?: any
  visible: boolean
  setVisible: (value: boolean) => void
}

const DeleteFunction = ({ func, visible, setVisible }: DeleteFunctionProps) => {
  const { project } = useProjectContext()
  const { id, name, schema } = func ?? {}

  const { mutate: deleteDatabaseFunction, isLoading } = useDatabaseFunctionDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully removed function ${name}`)
      setVisible(false)
    },
  })

  async function handleDelete() {
    if (!id) return console.error('Function ID is require')
    if (!project) return console.error('Project is required')

    deleteDatabaseFunction({
      id,
      projectRef: project.ref,
      connectionString: project.connectionString,
    })
  }

  return (
    <>
      <TextConfirmModal
        visible={visible}
        onCancel={() => setVisible(!visible)}
        onConfirm={handleDelete}
        title="Delete this function"
        loading={isLoading}
        confirmLabel={`Delete function ${name}`}
        confirmPlaceholder="Type in name of function"
        confirmString={name}
        text={`This will delete your function called ${name} of schema ${schema}.`}
        alert="You cannot recover this function once it is deleted!"
      />
    </>
  )
}

export default DeleteFunction
