import { OAuthAppsList } from 'components/interfaces/Auth/OAuthApps/OAuthAppsList'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { DocsButton } from 'components/ui/DocsButton'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { PageSection, PageSectionContent } from 'ui-patterns'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

const OAuthApps: NextPageWithLayout = () => (
  <>
    <PageHeader size="default">
      <PageHeaderMeta>
        <PageHeaderSummary>
          <PageHeaderTitle>OAuth Apps</PageHeaderTitle>
        </PageHeaderSummary>
        <PageHeaderAside>
          <DocsButton href={`${DOCS_URL}/guides/auth/oauth-server`} />
        </PageHeaderAside>
      </PageHeaderMeta>
    </PageHeader>
    <PageContainer size="default">
      <PageSection>
        <PageSectionContent>
          <OAuthAppsList />
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  </>
)

OAuthApps.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default OAuthApps
