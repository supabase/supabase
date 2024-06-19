import {
  CustomDomainConfig,
  DeleteProjectPanel,
  General,
  TransferProjectPanel,
} from 'components/interfaces/Settings/General'
import { SettingsLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ScaffoldContainer, ScaffoldHeader, ScaffoldTitle } from 'components/layouts/Scaffold'
import { useIsFeatureEnabled } from 'hooks'
import type { NextPageWithLayout } from 'types'

const ProjectSettings: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const isBranch = !!project?.parent_project_ref
  const { projectsTransfer: projectTransferEnabled } = useIsFeatureEnabled(['projects:transfer'])

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>Project Settings</ScaffoldTitle>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer className="flex flex-col gap-10" bottomPadding>
        <General />
        {!isBranch ? (
          <>
            <CustomDomainConfig />
            {projectTransferEnabled && <TransferProjectPanel />}
            <DeleteProjectPanel />
          </>
        ) : null}
      </ScaffoldContainer>
    </>
  )
}

ProjectSettings.getLayout = (page) => <SettingsLayout title="General">{page}</SettingsLayout>
export default ProjectSettings
