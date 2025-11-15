import { IS_PLATFORM } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { SettingsDatabase } from 'components/interfaces/Settings/Database/SettingsDatabase'
import { SettingsDatabaseEmptyStateLocal } from 'components/interfaces/Settings/Database/SettingsDatabaseEmptyStateLocal'
import { ScaffoldContainer, ScaffoldHeader, ScaffoldTitle } from 'components/layouts/Scaffold'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'

const ProjectSettings: NextPageWithLayout = () => {
  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>Database Settings</ScaffoldTitle>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer bottomPadding>
        {IS_PLATFORM ? <SettingsDatabase /> : <SettingsDatabaseEmptyStateLocal />}
      </ScaffoldContainer>
    </>
  )
}

ProjectSettings.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default ProjectSettings
