import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormHeader } from 'components/ui/Forms'
import Panel from 'components/ui/Panel'
import { Alert } from 'ui'
import DeleteProjectButton from './DeleteProjectButton'

const DeleteProjectPanel = () => {
  const { project } = useProjectContext()

  if (project === undefined) return null

  return (
    <section id="delete-project">
      <FormHeader title="Delete Project" description="" />
      <Panel>
        <Panel.Content>
          <Alert
            variant="danger"
            withIcon
            title="Deleting this project will also remove your database."
          >
            <div>
              <p className="mb-4 block">
                Make sure you have made a backup if you want to keep your data.
              </p>
              <DeleteProjectButton />
            </div>
          </Alert>
        </Panel.Content>
      </Panel>
    </section>
  )
}

export default DeleteProjectPanel
