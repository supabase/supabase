import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'
import { DataApiURLSettings } from './DataApiURLSettings'

export const DataApiOverviewTab = () => {
  return (
    <IntegrationOverviewTab>
      <div className="px-4 md:px-10 max-w-4xl space-y-4">
        <DataApiURLSettings />
      </div>
    </IntegrationOverviewTab>
  )
}
