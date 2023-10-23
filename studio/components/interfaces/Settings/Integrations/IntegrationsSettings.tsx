import SidePanelGitHubRepoLinker from 'components/interfaces/Organization/IntegrationSettings/SidePanelGitHubRepoLinker'
import SidePanelVercelProjectLinker from 'components/interfaces/Organization/IntegrationSettings/SidePanelVercelProjectLinker'
import { ScaffoldDivider } from 'components/layouts/Scaffold'
import { BASE_PATH } from 'lib/constants'
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
  return (
    <>
      <GitHubSection />
      <ScaffoldDivider />
      <VercelSection />
      <SidePanelVercelProjectLinker />
      <SidePanelGitHubRepoLinker />
    </>
  )
}

export default IntegrationSettings
