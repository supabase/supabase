import ReplicationComingSoon from 'components/interfaces/Database/Replication/ComingSoon'
import Destinations from 'components/interfaces/Database/Replication/Destinations'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import { useFlag } from 'hooks/ui/useFlag'
import type { NextPageWithLayout } from 'types'

const DatabaseReplicationPage: NextPageWithLayout = () => {
  const enablePgReplicate = useFlag('enablePgReplicate')

  return (
    <>
      {enablePgReplicate ? (
        <>
          <ScaffoldContainer>
            <ScaffoldHeader>
              <ScaffoldTitle>Replication</ScaffoldTitle>
              <Destinations />
            </ScaffoldHeader>
          </ScaffoldContainer>
        </>
      ) : (
        <>
          <ScaffoldContainer>
            <ScaffoldHeader>
              <ScaffoldTitle>Replication</ScaffoldTitle>
              <ScaffoldDescription>Send data to other destinations</ScaffoldDescription>
            </ScaffoldHeader>
          </ScaffoldContainer>
          <ReplicationComingSoon />
        </>
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
