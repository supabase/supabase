import { FC } from 'react'
import { Alert } from '@supabase/ui'

import { useStore } from 'hooks'
import Panel from 'components/ui/Panel'

import DeleteProjectButton from './DeleteProjectButton'

interface Props {}

const DeleteProjectPanel: FC<Props> = ({}) => {
  const { ui } = useStore()
  const project = ui.selectedProject

  if (project === undefined) return <></>

  return (
    <section>
      <Panel title={<p className="uppercase">Danger Zone</p>}>
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
