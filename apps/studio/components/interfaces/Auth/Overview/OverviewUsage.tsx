import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { Card } from 'ui'

export const OverviewUsage = () => {
  return (
    <ScaffoldSection isFullWidth>
      <ScaffoldSectionTitle className="mb-4">Usage</ScaffoldSectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-30 pointer-events-none">
        <Card className="aspect-video" />
        <Card className="aspect-video" />
      </div>
    </ScaffoldSection>
  )
}
