import { useParams } from 'common'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { RolesList } from '@/components/interfaces/Database/Roles/RolesList'
import DatabaseLayout from '@/components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from '@/types'

const DatabaseRoles: NextPageWithLayout = () => {
  const { ref } = useParams()
  const showRoles = useIsFeatureEnabled('database:roles')

  if (!showRoles) {
    return <UnknownInterface urlBack={`/project/${ref}/database/schemas`} />
  }

  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Database Roles</PageHeaderTitle>
            <PageHeaderDescription>
              Manage access control to your database through users, groups, and permissions
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <RolesList />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

DatabaseRoles.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Roles">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseRoles
