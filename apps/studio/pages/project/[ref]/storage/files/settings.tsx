import { StorageSettings } from 'components/interfaces/Storage/StorageSettings/StorageSettings'
import DefaultLayout from 'components/layouts/DefaultLayout'
import {
  ScaffoldSection,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { StorageUILayout } from 'components/layouts/StorageLayout/StorageUILayout'
import type { NextPageWithLayout } from 'types'

const FilesSettingsPage: NextPageWithLayout = () => {
  return (
    <ScaffoldSection isFullWidth>
      <ScaffoldSectionTitle>Global settings</ScaffoldSectionTitle>
      <ScaffoldSectionDescription>
        Set limits or transformations across all file buckets.
      </ScaffoldSectionDescription>
      <StorageSettings />
    </ScaffoldSection>
  )
}

FilesSettingsPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Storage">
      <StorageUILayout>{page}</StorageUILayout>
    </StorageLayout>
  </DefaultLayout>
)

export default FilesSettingsPage
