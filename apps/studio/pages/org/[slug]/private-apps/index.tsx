import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { AppsList } from '@/components/interfaces/Organization/PrivateApps/Apps/AppsList/AppsList'
import { CreateAppSheet } from '@/components/interfaces/Organization/PrivateApps/Apps/CreateAppSheet/CreateAppSheet'
import {
  PrivateAppsProvider,
  usePrivateApps,
} from '@/components/interfaces/Organization/PrivateApps/PrivateAppsContext'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import OrganizationLayout from '@/components/layouts/OrganizationLayout'
import OrganizationSettingsLayout from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'
import type { NextPageWithLayout } from '@/types'

function PrivateAppsContent() {
  const { apps, isLoading } = usePrivateApps()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Private Apps</PageHeaderTitle>
            <PageHeaderDescription>
              Create private apps to generate scoped access tokens for your organization
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="default" className="pb-16">
        <PageSection id="apps">
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Apps</PageSectionTitle>
              <PageSectionDescription>
                Registered private apps and their credentials
              </PageSectionDescription>
            </PageSectionSummary>
            {!isLoading && apps.length > 0 && (
              <PageSectionAside>
                <Button
                  type="primary"
                  icon={<Plus size={14} />}
                  onClick={() => setShowCreate(true)}
                >
                  Create app
                </Button>
              </PageSectionAside>
            )}
          </PageSectionMeta>
          <PageSectionContent>
            <AppsList onCreateApp={() => setShowCreate(true)} />
          </PageSectionContent>
        </PageSection>
      </PageContainer>

      <CreateAppSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => setShowCreate(false)}
      />
    </>
  )
}

const PrivateAppsPage: NextPageWithLayout = () => {
  return <PrivateAppsContent />
}

PrivateAppsPage.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout title="Private Apps">
      <OrganizationSettingsLayout>
        <PrivateAppsProvider>{page}</PrivateAppsProvider>
      </OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)

export default PrivateAppsPage
