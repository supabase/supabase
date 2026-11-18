import { createFileRoute } from '@tanstack/react-router'
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
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export const Route = createFileRoute('/project/$ref/database/roles')({
  component: DatabaseRoles,
  staticData: {
    databaseLayoutTitle: 'Roles',
  },
})

function DatabaseRoles() {
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
