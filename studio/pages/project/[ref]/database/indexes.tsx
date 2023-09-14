import Indexes from 'components/interfaces/Database/Indexes/Indexes'
import { DatabaseLayout } from 'components/layouts'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { NextPageWithLayout } from 'types'

const IndexesPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <Indexes />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

IndexesPage.getLayout = (page) => <DatabaseLayout title="Indexes">{page}</DatabaseLayout>

export default IndexesPage
