import {
  CustomDomainConfig,
  DeleteProjectPanel,
  General,
  Infrastructure,
  TransferProjectPanel,
} from 'components/interfaces/Settings/General'
import { SettingsLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useFlag, useSelectedOrganization } from 'hooks'
import { NextPageWithLayout } from 'types'

const ProjectSettings: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const organization = useSelectedOrganization()
  const isBranch = !!project?.parent_project_ref
  const isOrgBilling = !!organization?.subscription_id
  const transferProjectEnabled = useFlag('transferProject')

  // [Joshen] Opting for larger gap instead of gap-8 as compared to other pages for better grouping of content
  return (
    <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 py-6 lg:px-16 xl:px-24 2xl:px-32 ">
      <General />
      {!isBranch ? (
        <>
          {!isOrgBilling && <Infrastructure />}
          {<CustomDomainConfig />}
          {transferProjectEnabled && <TransferProjectPanel />}
          <DeleteProjectPanel />
        </>
      ) : null}
    </div>
  )
}

ProjectSettings.getLayout = (page) => <SettingsLayout title="General">{page}</SettingsLayout>
export default ProjectSettings
