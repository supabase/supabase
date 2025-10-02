import { S3Connection } from 'components/interfaces/Storage/StorageSettings/S3Connection'
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
    <>
      <ScaffoldSection isFullWidth>
        <ScaffoldSectionTitle>General Settings</ScaffoldSectionTitle>
        <ScaffoldSectionDescription>
          Configure upload limits and toggle storage features for your project
        </ScaffoldSectionDescription>
        <StorageSettings />
      </ScaffoldSection>
      <S3Connection />
    </>
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
