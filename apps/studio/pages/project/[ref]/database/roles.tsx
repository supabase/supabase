import { RolesList } from 'components/interfaces/Database'
import { DatabaseLayout } from 'components/layouts'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms'
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

DatabaseRoles.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default DatabaseRoles
