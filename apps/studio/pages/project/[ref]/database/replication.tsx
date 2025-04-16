import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import type { NextPageWithLayout } from 'types'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import Destinations from 'components/interfaces/Database/Replication/Destinations'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { useFlag } from 'hooks/ui/useFlag'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'

const DatabaseReplicationPage: NextPageWithLayout = () => {
  const enablePgReplicate = useFlag('enablePgReplicate')

  return (
    <>
      {enablePgReplicate ? (
        <ScaffoldContainer>
          <Destinations />
        </ScaffoldContainer>
      ) : (
        <ScaffoldContainer>
          <ScaffoldSection>
            <div className="col-span-12">
              <FormHeader
                title="Feature Unavailable"
                description="This feature is not available for you"
              />
            </div>
          </ScaffoldSection>
        </ScaffoldContainer>
      )}
    </>
  )
}

DatabaseReplicationPage.getLayout = (page) => (
  <DefaultLayout>
    <PageLayout title="Database Replication" subtitle="Send data to other destinations">
      {page}
    </PageLayout>
  </DefaultLayout>
)

export default DatabaseReplicationPage
