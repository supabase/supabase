import type { NextPageWithLayout } from 'types'
import Destinations from 'components/interfaces/Database/Replication/Destinations'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { useFlag } from 'hooks/ui/useFlag'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { Admonition } from 'ui-patterns'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'

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
          <ScaffoldSection isFullWidth>
            <Admonition type="default" title="Coming soon">
              <p className="!mb-0">Replication is not yet available for your project</p>
            </Admonition>
          </ScaffoldSection>
        </ScaffoldContainer>
      )}
    </>
  )
}

DatabaseReplicationPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">
      <PageLayout title="Database Replication" subtitle="Send data to other destinations">
        {page}
      </PageLayout>
    </DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseReplicationPage
