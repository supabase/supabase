import { TextConfirmModal } from 'components/ui/TextConfirmModalWrapper'
import type { DatabaseFunction } from 'data/database-functions/database-functions-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

interface DeleteFunctionProps {
  func?: DatabaseFunction
  visible: boolean
  setVisible: (value: string | null) => void
  onDelete: (params: {
    func: DatabaseFunction
    projectRef: string
    connectionString?: string | null
  }) => void
  isLoading: boolean
}

export const DeleteFunction = ({
  func,
  visible,
  setVisible,
  onDelete,
  isLoading,
}: DeleteFunctionProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { name, schema } = func ?? {}

  async function handleDelete() {
    if (!func) return console.error('Function is required')
    if (!project) return console.error('Project is required')

    onDelete({
      func,
      projectRef: project.ref,
      connectionString: project.connectionString,
    })
  }

  return (
    <TextConfirmModal
      variant={'warning'}
      visible={visible}
      onCancel={() => setVisible(null)}
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
  )
}
