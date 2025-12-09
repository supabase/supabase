import { TextSearch } from 'lucide-react'
import { Button } from 'ui'
import { AdvisorTab } from 'state/advisor-state'

interface EmptyAdvisorProps {
  activeTab: AdvisorTab
  hasFilters: boolean
  onClearFilters: () => void
}

export const EmptyAdvisor = ({ activeTab, hasFilters, onClearFilters }: EmptyAdvisorProps) => {
  const getHeading = () => {
    if (hasFilters) return 'No items found'

    switch (activeTab) {
      case 'security':
        return 'No security issues detected'
      case 'performance':
        return 'No performance issues detected'
      case 'messages':
        return 'No messages'
      default:
        return 'No issues detected'
    }
  }

  const getMessage = () => {
    if (hasFilters) return 'No advisor items match your current filters'

    switch (activeTab) {
      case 'security':
        return 'Congrats! There are no security issues detected for this project'
      case 'performance':
        return 'Congrats! There are no performance issues detected for this project'
      case 'messages':
        return 'Messages alert you of upcoming changes or potential issues with your project'
      default:
        return 'Congrats! There are no issues detected'
    }
  }

  return (
    <div className="absolute top-28 px-6 flex flex-col items-center justify-center w-full gap-y-2">
      <TextSearch className="text-foreground-muted" strokeWidth={1} />
      <div className="text-center">
        <p className="heading-default">{getHeading()}</p>
        <p className="text-foreground-light text-sm">{getMessage()}</p>
      </div>
      {hasFilters && (
        <Button type="outline" onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  )
}
