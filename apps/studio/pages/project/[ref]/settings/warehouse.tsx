import {
  CustomDomainConfig,
  DeleteProjectPanel,
  General,
  TransferProjectPanel,
} from 'components/interfaces/Settings/General'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { ScaffoldContainer, ScaffoldHeader, ScaffoldTitle } from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'
import { WarehouseAccessTokens } from 'components/interfaces/DataWarehouse/WarehouseAccessTokens'

const WarehouseSettings: NextPageWithLayout = () => {
  const { project } = useProjectContext()

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>Warehouse Settings</ScaffoldTitle>
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
