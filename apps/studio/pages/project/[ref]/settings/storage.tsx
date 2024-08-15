import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import { StorageSettings } from 'components/to-be-cleaned/Storage'
import { S3Connection } from 'components/to-be-cleaned/Storage/StorageSettings/S3Connection'
import type { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>Storage Settings</ScaffoldTitle>
          <ScaffoldDescription>Configure your project's storage settings</ScaffoldDescription>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer className="flex flex-col gap-10" bottomPadding>
        <StorageSettings />
        <S3Connection />
      </ScaffoldContainer>
    </>
  )
}

PageLayout.getLayout = (page) => <SettingsLayout title="Settings">{page}</SettingsLayout>
export default PageLayout
