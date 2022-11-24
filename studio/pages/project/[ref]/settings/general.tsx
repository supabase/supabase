import { observer } from 'mobx-react-lite'
import { useFlag } from 'hooks'
import { NextPageWithLayout } from 'types'
import { SettingsLayout } from 'components/layouts'
import { General, Infrastructure, DeleteProjectPanel } from 'components/interfaces/Settings/General'
import CustomDomainConfig from 'components/interfaces/Settings/API/CustomDomainConfig/CustomDomainConfig'

const ProjectSettings: NextPageWithLayout = () => {
  const isCustomDomainsEnabled = useFlag('customDomains')

  return (
    <div className="1xl:px-28 mx-auto flex flex-col gap-8 px-5 py-6 lg:px-16 xl:px-24 2xl:px-32 ">
      <General />
      <Infrastructure />
      {isCustomDomainsEnabled && <CustomDomainConfig />}
      <DeleteProjectPanel />
    </div>
  )
}

ProjectSettings.getLayout = (page) => <SettingsLayout title="General">{page}</SettingsLayout>
export default observer(ProjectSettings)
