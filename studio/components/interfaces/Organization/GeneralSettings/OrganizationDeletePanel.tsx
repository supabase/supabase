import { observer } from 'mobx-react-lite'
import { Alert } from 'ui'

import Panel from 'components/ui/Panel'
import DeleteOrganizationButton from './DeleteOrganizationButton'

const OrganizationDeletePanel = observer(() => {
  return (
    <Panel
      title={
        <p key="panel-title" className="uppercase">
          Danger Zone
        </p>
      }
    >
      <Panel.Content>
        <Alert
          withIcon
          variant="danger"
          // @ts-ignore
          title={
            <span className="text-red-900">
              Deleting this organization will also remove its projects
            </span>
          }
        >
          <p className="text-red-900">
            Make sure you have made a backup if you want to keep your data
          </p>
          <DeleteOrganizationButton />
        </Alert>
      </Panel.Content>
    </Panel>
  )
})

export default OrganizationDeletePanel
