import { useMemo } from 'react'
import { toast } from 'sonner'

import ProjectLinker from 'components/interfaces/Integrations/VercelGithub/ProjectLinker'
import { Markdown } from 'components/interfaces/Markdown'
import { useGitHubAuthorizationQuery } from 'data/integrations/github-authorization-query'
import { useGitHubConnectionCreateMutation } from 'data/integrations/github-connection-create-mutation'
import { useGitHubConnectionDeleteMutation } from 'data/integrations/github-connection-delete-mutation'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useGitHubRepositoriesQuery } from 'data/integrations/github-repositories-query'
import type { IntegrationConnectionsCreateVariables } from 'data/integrations/integrations.types'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { openInstallGitHubIntegrationWindow } from 'lib/github'
import { EMPTY_ARR } from 'lib/void'
import { useSidePanelsStateSnapshot } from 'state/side-panels'
import { Button, SidePanel } from 'ui'
import SidePanelGitHubRepoLinker from './SidePanelGitHubRepoLinker'
import SidePanelGitLabRepoLinker from './SidePanelGitLabRepoLinker'

const GITHUB_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 96" className="w-6">
    <path
      fill="#ffffff"
      fillRule="evenodd"
      d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
      clipRule="evenodd"
    />
  </svg>
)

const GITLAB_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="93.97 97.52 192.05 184.99">
    <g id="LOGO">
      <path
        fill="#e24329"
        d="M282.83,170.73l-.27-.69-26.14-68.22a6.81,6.81,0,0,0-2.69-3.24,7,7,0,0,0-8,.43,7,7,0,0,0-2.32,3.52l-17.65,54H154.29l-17.65-54A6.86,6.86,0,0,0,134.32,99a7,7,0,0,0-8-.43,6.87,6.87,0,0,0-2.69,3.24L97.44,170l-.26.69a48.54,48.54,0,0,0,16.1,56.1l.09.07.24.17,39.82,29.82,19.7,14.91,12,9.06a8.07,8.07,0,0,0,9.76,0l12-9.06,19.7-14.91,40.06-30,.1-.08A48.56,48.56,0,0,0,282.83,170.73Z"
      ></path>
      <path
        fill="#fc6d26"
        d="M282.83,170.73l-.27-.69a88.3,88.3,0,0,0-35.15,15.8L190,229.25c19.55,14.79,36.57,27.64,36.57,27.64l40.06-30,.1-.08A48.56,48.56,0,0,0,282.83,170.73Z"
      ></path>
      <path
        fill="#fca326"
        d="M153.43,256.89l19.7,14.91,12,9.06a8.07,8.07,0,0,0,9.76,0l12-9.06,19.7-14.91S209.55,244,190,229.25C170.45,244,153.43,256.89,153.43,256.89Z"
      ></path>
      <path
        fill="#fc6d26"
        d="M132.58,185.84A88.19,88.19,0,0,0,97.44,170l-.26.69a48.54,48.54,0,0,0,16.1,56.1l.09.07.24.17,39.82,29.82s17-12.85,36.57-27.64Z"
      ></path>
    </g>
  </svg>
)

export type SidePanelGitRepoLinkerProps = {
  projectRef?: string
}

const SidePanelGitRepoLinker = ({ projectRef }: SidePanelGitRepoLinkerProps) => {
  const sidePanelStateSnapshot = useSidePanelsStateSnapshot()

  function onSelectGitHubProvider() {
    sidePanelStateSnapshot.setGithubConnectionsOpen(true)
    sidePanelStateSnapshot.setGitConnectionsOpen(false)
  }

  function onSelectGitLabProvider() {
    sidePanelStateSnapshot.setGitlabConnectionsOpen(true)
    sidePanelStateSnapshot.setGitConnectionsOpen(false)
  }

  return (
    <>
      <SidePanel
        header={'Add Git repository'}
        size="large"
        visible={sidePanelStateSnapshot.gitConnectionsOpen}
        hideFooter
        onCancel={() => sidePanelStateSnapshot.setGitConnectionsOpen(false)}
      >
        <div className="py-10 flex flex-col gap-6 bg-studio h-full">
          <SidePanel.Content className="flex flex-col gap-4">
            <Markdown
              content={`
### Choose a Git provider to connect to
          `}
            />
            <Button type="default" icon={GITHUB_ICON} onClick={() => onSelectGitHubProvider()}>
              GitHub
            </Button>
            <Button type="default" icon={GITLAB_ICON} onClick={() => onSelectGitLabProvider()}>
              GitLab
            </Button>
          </SidePanel.Content>
        </div>
      </SidePanel>
      <SidePanelGitHubRepoLinker projectRef={projectRef} />
      <SidePanelGitLabRepoLinker projectRef={projectRef} />
    </>
  )
}

export default SidePanelGitRepoLinker
