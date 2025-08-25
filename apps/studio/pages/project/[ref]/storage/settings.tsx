import DefaultLayout from 'components/layouts/DefaultLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { StorageSettings } from 'components/interfaces/Storage'
import { S3Connection } from 'components/interfaces/Storage/StorageSettings/S3Connection'
import type { NextPageWithLayout } from 'types'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'

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
