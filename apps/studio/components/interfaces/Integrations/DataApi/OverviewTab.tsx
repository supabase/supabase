import { ServiceList } from 'components/interfaces/Settings/API/ServiceList'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'

export const DataApiOverviewTab = () => {
  return (
    <IntegrationOverviewTab>
      <ScaffoldContainer bottomPadding>
        <ServiceList />
      </ScaffoldContainer>
    </IntegrationOverviewTab>
  )
}
