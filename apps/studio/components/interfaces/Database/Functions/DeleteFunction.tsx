import toast from 'react-hot-toast'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'
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
        variant={'warning'}
        visible={visible}
        onCancel={() => setVisible(!visible)}
        onConfirm={handleDelete}
        title="Delete this function"
        loading={isLoading}
        confirmLabel={`Delete function ${name}`}
        confirmPlaceholder="Type in name of function"
        confirmString={name}
        text={
          <>
            <span>This will delete the function</span>{' '}
            <span className="text-bold text-foreground">{name}</span> <span>from the schema</span>{' '}
            <span className="text-bold text-foreground">{schema}</span>
          </>
        }
        alert={{ title: 'You cannot recover this function once deleted.' }}
      />
    </>
  )
}

export default DeleteFunction
