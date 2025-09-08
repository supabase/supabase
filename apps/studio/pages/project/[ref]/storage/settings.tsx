import { S3Connection } from 'components/interfaces/Storage/StorageSettings/S3Connection'
import { StorageSettings } from 'components/interfaces/Storage/StorageSettings/StorageSettings'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import type { NextPageWithLayout } from 'types'

const StorageSettingsPage: NextPageWithLayout = () => {
  return (
    <>
      <StorageSettings />
      <S3Connection />
    </>
  )
}

StorageSettingsPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Settings">
      <PageLayout title="Storage settings" subtitle="Configure your project's storage settings">
        <ScaffoldContainer>{page}</ScaffoldContainer>
      </PageLayout>
    </StorageLayout>
  </DefaultLayout>
)
export default StorageSettingsPage
