import { SidePanelVercelProjectLinker } from './SidePanelVercelProjectLinker'
import { GitHubSection } from '@/components/interfaces/Settings/Integrations/GithubIntegration/GithubSection'
import { VercelSection } from '@/components/interfaces/Settings/Integrations/VercelIntegration/VercelSection'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export const IntegrationSettings = () => {
  const showVercelIntegration = useIsFeatureEnabled('integrations:vercel')

  return (
    <>
      <GitHubSection isProjectScoped={false} />
      {showVercelIntegration && (
        <>
          <VercelSection isProjectScoped={false} />
          <SidePanelVercelProjectLinker />
        </>
      )}
    </>
  )
}
