import ReplicationComingSoon from 'components/interfaces/Database/Replication/ComingSoon'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldSection,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'
import { Admonition } from 'ui-patterns'

const DatabaseReplicationPage: NextPageWithLayout = () => {
  //const enablePgReplicate = useFlag('enablePgReplicate')
  const enablePgReplicate = true

  return (
    <>
      {enablePgReplicate ? (
        <>
          <ScaffoldContainer>
            <ScaffoldHeader>
              <ScaffoldTitle>Replication</ScaffoldTitle>
              <ScaffoldDescription>Send data to other destinations</ScaffoldDescription>
            </ScaffoldHeader>
          </ScaffoldContainer>
          <ReplicationComingSoon />
        </>
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
    <DatabaseLayout title="Database Replication">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseReplicationPage
