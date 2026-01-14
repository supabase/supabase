import { useParams } from 'common'
import DatabaseBackupsNav from 'components/interfaces/Database/Backups/DatabaseBackupsNav'
import { RestoreToNewProject } from 'components/interfaces/Database/RestoreToNewProject/RestoreToNewProject'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderMeta,
  PageHeaderNavigationTabs,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

const RestoreToNewProjectPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { databaseRestoreToNewProject } = useIsFeatureEnabled(['database:restore_to_new_project'])

  if (!databaseRestoreToNewProject) {
    return <UnknownInterface urlBack={`/project/${ref}/database/backups/scheduled`} />
  }

  return (
    <>
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Database Backups</PageHeaderTitle>
          </PageHeaderSummary>
        </PageHeaderMeta>
        <PageHeaderNavigationTabs>
          <DatabaseBackupsNav active="rtnp" />
        </PageHeaderNavigationTabs>
      </PageHeader>
      <PageContainer>
        <PageSection>
          <PageSectionContent>
            <div className="space-y-8">
              <RestoreToNewProject />
            </div>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

RestoreToNewProjectPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default RestoreToNewProjectPage
