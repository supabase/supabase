import { ScaffoldSectionTitle, ScaffoldSection } from 'components/layouts/Scaffold'
import { Card } from 'ui'

export const OverviewMonitoring = () => {
  return (
    <ScaffoldSection isFullWidth>
      <ScaffoldSectionTitle className="mb-4">Monitoring</ScaffoldSectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-30 pointer-events-none">
        <Card className="h-36" />
        <Card className="h-36" />
        <Card className="aspect-video" />
        <Card className="aspect-video" />
      </div>
    </ScaffoldSection>
  )
}
