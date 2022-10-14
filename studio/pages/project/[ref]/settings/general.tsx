import { observer } from 'mobx-react-lite'
import { NextPageWithLayout } from 'types'
import { SettingsLayout } from 'components/layouts'
import { FormsContainer } from 'components/ui/Forms'
import { General, Infrastructure, DeleteProjectPanel } from 'components/interfaces/Settings/General'

const ProjectSettings: NextPageWithLayout = () => {
  return (
    <FormsContainer>
      <General />
      <Infrastructure />
      <DeleteProjectPanel />
    </FormsContainer>
  )
}

ProjectSettings.getLayout = (page) => <SettingsLayout title="General">{page}</SettingsLayout>
export default observer(ProjectSettings)
