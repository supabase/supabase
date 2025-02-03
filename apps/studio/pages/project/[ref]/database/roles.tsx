import { RolesList } from 'components/interfaces/Database'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import type { NextPageWithLayout } from 'types'

const DatabaseRoles: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <FormHeader
            title="Database Roles"
            description="Manage access control to your database through users, groups, and permissions"
          />
          <RolesList />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

DatabaseRoles.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout product="Roles">
      <DatabaseLayout title="Database">{page}</DatabaseLayout>
    </DefaultLayout>
  </AppLayout>
)

export default DatabaseRoles
