import { ServiceList } from 'components/interfaces/Settings/API/ServiceList'
import { PageContainer } from 'ui-patterns'

export const DataApiSettingsTab = () => {
  return (
    <PageContainer size="default" className="ml-0">
      <ServiceList />
    </PageContainer>
  )
}
