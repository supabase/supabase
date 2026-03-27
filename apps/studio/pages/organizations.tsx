import { useParams } from 'common'
import { OrganizationsHomeContent } from 'components/interfaces/Organization/OrganizationsHomeContent'
import { AppLayout } from 'components/layouts/AppLayout/AppLayout'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { useCustomContent } from 'hooks/custom-content/useCustomContent'
import { withAuth } from 'hooks/misc/withAuth'
import { buildStudioPageTitle } from 'lib/page-title'
import Head from 'next/head'
import type { NextPageWithLayout } from 'types'

const OrganizationsPage: NextPageWithLayout = () => {
  const { appTitle } = useCustomContent(['app:title'])
  const { error: orgNotFoundError, org: orgSlug } = useParams()
  const orgNotFound = orgNotFoundError === 'org_not_found'
  const pageTitle = buildStudioPageTitle({
    section: 'Organizations',
    brand: appTitle || 'Supabase',
  })

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content="Supabase Studio" />
      </Head>
      <OrganizationsHomeContent
        orgNotFound={orgNotFound}
        orgNotFoundSlug={orgSlug}
      />
    </>
  )
}

OrganizationsPage.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout hideMobileMenu headerTitle="Organizations">
      <PageLayout title="Your Organizations" className="max-w-[1200px] lg:px-6 mx-auto">
        {page}
      </PageLayout>
    </DefaultLayout>
  </AppLayout>
)

export default withAuth(OrganizationsPage)
