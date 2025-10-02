import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { Card } from 'ui'

export const OverviewLearnMore = () => {
  return (
    <ScaffoldSection isFullWidth>
      <ScaffoldSectionTitle className="mb-4">Learn more</ScaffoldSectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-30 pointer-events-none">
        <Card className="aspect-square" />
        <Card className="aspect-square" />
        <Card className="aspect-square" />
      </div>
    </ScaffoldSection>
  )
}
