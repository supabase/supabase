import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { ScaffoldContainer, ScaffoldHeader, ScaffoldTitle } from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

const LogsSettings: NextPageWithLayout = () => {
  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>Logs Settings</ScaffoldTitle>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer className="flex flex-col gap-10" bottomPadding>
        logs
      </ScaffoldContainer>
    </>
  )
}

LogsSettings.getLayout = (page) => <SettingsLayout title="Logs">{page}</SettingsLayout>
export default LogsSettings
