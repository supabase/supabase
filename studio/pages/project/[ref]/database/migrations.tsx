import Migrations from 'components/interfaces/Database/Migrations/Migrations'
import { DatabaseLayout } from 'components/layouts'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { NextPageWithLayout } from 'types'

const MigrationsPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <Migrations />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

MigrationsPage.getLayout = (page) => <DatabaseLayout title="Migrations">{page}</DatabaseLayout>

export default MigrationsPage
