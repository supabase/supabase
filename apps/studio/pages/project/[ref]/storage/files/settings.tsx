import { StorageSettings } from 'components/interfaces/Storage/StorageSettings/StorageSettings'
import DefaultLayout from 'components/layouts/DefaultLayout'
import {
  ScaffoldSection,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import { StorageFilesLayout } from 'components/layouts/StorageLayout/StorageFilesLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import type { NextPageWithLayout } from 'types'

const FilesSettingsPage: NextPageWithLayout = () => {
  return (
    <ScaffoldSection isFullWidth>
      <ScaffoldSectionTitle>File settings</ScaffoldSectionTitle>
      <ScaffoldSectionDescription>
        Global settings across all file buckets.
      </ScaffoldSectionDescription>
      <StorageSettings />
    </ScaffoldSection>
  )
}

FilesSettingsPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Storage">
      <StorageFilesLayout>{page}</StorageFilesLayout>
    </StorageLayout>
  </DefaultLayout>
)

export default FilesSettingsPage
