import Link from 'next/link'

import SidePanelGitHubRepoLinker from 'components/interfaces/Organization/IntegrationSettings/SidePanelGitHubRepoLinker'
import SidePanelVercelProjectLinker from 'components/interfaces/Organization/IntegrationSettings/SidePanelVercelProjectLinker'
import { ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import { useProjectByRef, useSelectedProject } from 'hooks/misc/useSelectedProject'
import { BASE_PATH } from 'lib/constants'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, WarningIcon } from 'ui'
import GitHubSection from './GithubIntegration/GithubSection'
import VercelSection from './VercelIntegration/VercelSection'

export const IntegrationImageHandler = ({ title }: { title: 'vercel' | 'github' }) => {
  return (
    <img
      className="border rounded-lg shadow w-48 mt-6 border-body"
      src={`${BASE_PATH}/img/integrations/covers/${title}-cover.png`}
      alt={`${title} cover`}
    />
  )
}

const IntegrationSettings = () => {
  const project = useSelectedProject()
  const parentProject = useProjectByRef(project?.parent_project_ref)
  const isBranch = project?.parent_project_ref !== undefined

  return (
    <>
      {isBranch && (
        <ScaffoldContainer>
          <Alert_Shadcn_ variant="default" className="mt-6">
            <WarningIcon />
            <AlertTitle_Shadcn_>
              You are currently on a preview branch of your project
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              To adjust your project's integration settings, you may return to your{' '}
              <Link href={`/project/${parentProject?.ref}/settings/general`} className="text-brand">
                main branch
              </Link>
              .
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        </ScaffoldContainer>
      )}
      <GitHubSection />
      <ScaffoldDivider />
      <VercelSection isProjectScoped={true} />
      <SidePanelVercelProjectLinker />
      <SidePanelGitHubRepoLinker />
    </>
  )
}

export default IntegrationSettings
