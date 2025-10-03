import { S3Connection } from 'components/interfaces/Storage/StorageSettings/S3Connection'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import type { NextPageWithLayout } from 'types'

const S3SettingsPage: NextPageWithLayout = () => {
  return <S3Connection />
}

S3SettingsPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="S3 Settings">
      <PageLayout title="S3 Settings">
        <ScaffoldContainer>{page}</ScaffoldContainer>
      </PageLayout>
    </StorageLayout>
  </DefaultLayout>
)
export default S3SettingsPage
