import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'
import { WarehouseAccessTokens } from 'components/interfaces/DataWarehouse/WarehouseAccessTokens'

const WarehouseSettings: NextPageWithLayout = () => {
  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>Analytics Settings</ScaffoldTitle>
          <ScaffoldDescription>Configure your analytics settings</ScaffoldDescription>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer className="flex flex-col gap-10" bottomPadding>
        <WarehouseAccessTokens />
      </ScaffoldContainer>
    </>
  )
}

WarehouseSettings.getLayout = (page) => <SettingsLayout title="Warehouse">{page}</SettingsLayout>
export default WarehouseSettings
