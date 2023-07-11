import GitHubIntegrationWindowLayout from 'components/layouts/IntegrationsLayout/GitHubIntegrationWindowLayout'
import { NextPageWithLayout } from 'types'

const ChooseProjectGitHubPage: NextPageWithLayout = () => {
  return <div></div>
}

ChooseProjectGitHubPage.getLayout = (page) => (
  <GitHubIntegrationWindowLayout>{page}</GitHubIntegrationWindowLayout>
)

export default ChooseProjectGitHubPage
