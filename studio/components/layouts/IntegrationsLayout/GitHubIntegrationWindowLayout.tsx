import { PropsWithChildren } from 'react'

import { BASE_PATH } from 'lib/constants'
import IntegrationWindowLayout from './IntegrationWindowLayout'

const GITHUB_ICON = (
  <div className="bg-black shadow rounded p-1 w-8 h-8 flex justify-center items-center">
    <img
      src={`${BASE_PATH}/img/icons/github-icon-dark.svg`}
      alt="GitHub Icon"
      className="w-[18px]"
    />
  </div>
)

const GitHubIntegrationWindowLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <IntegrationWindowLayout title="Supabase + GitHub Integration" integrationIcon={GITHUB_ICON}>
      {children}
    </IntegrationWindowLayout>
  )
}

export default GitHubIntegrationWindowLayout
