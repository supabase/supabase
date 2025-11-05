import { useParams } from 'common'
import { RolesList } from 'components/interfaces/Database/Roles/RolesList'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'

const DatabaseRoles: NextPageWithLayout = () => {
  const { ref } = useParams()
  const showRoles = useIsFeatureEnabled('database:roles')

  if (!showRoles) {
    return <UnknownInterface urlBack={`/project/${ref}/database/schemas`} />
  }

  return (
    <ScaffoldContainer size="large">
      <ScaffoldSection isFullWidth>
        <RolesList />
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

DatabaseRoles.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">
      <PageLayout
        title="Database Roles"
        subtitle="Manage access control to your database through users, groups, and permissions"
        size="large"
      >
        {page}
      </PageLayout>
    </DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseRoles
