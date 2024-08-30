import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseFunctionDeleteMutation } from 'data/database-functions/database-functions-delete-mutation'
import { DatabaseFunction } from 'data/database-functions/database-functions-query'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

interface DeleteFunctionProps {
  func?: DatabaseFunction
  visible: boolean
  setVisible: (value: boolean) => void
}

const DeleteFunction = ({ func, visible, setVisible }: DeleteFunctionProps) => {
  const { project } = useProjectContext()
  const { name, schema } = func ?? {}

  const { mutate: deleteDatabaseFunction, isLoading } = useDatabaseFunctionDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully removed function ${name}`)
      setVisible(false)
    },
  })

  async function handleDelete() {
    if (!func) return console.error('Function is required')
    if (!project) return console.error('Project is required')

    deleteDatabaseFunction({
      func,
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
        confirmString={name ?? 'Unknown'}
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
