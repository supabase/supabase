import { TextSearch } from 'lucide-react'
import { Button } from 'ui'

import type { AdvisorCategory } from '@/state/advisor-state'

const emptyCopyByCategory: Record<AdvisorCategory, { heading: string; message: string }> = {
  security: {
    heading: 'No security issues detected',
    message: 'Congrats! There are no security issues detected for this project',
  },
  performance: {
    heading: 'No performance issues detected',
    message: 'Congrats! There are no performance issues detected for this project',
  },
  health: {
    heading: 'No health issues detected',
    message: 'Your database, instance and services are all responding normally',
  },
  messages: {
    heading: 'No messages',
    message: 'Messages alert you of upcoming changes or potential issues with your project',
  },
}

interface EmptyAdvisorProps {
  categoryFilters: AdvisorCategory[]
  /**
   * Whether severity or status filters are narrowing the list. Unlike the category filter,
   * these can hide items the user would otherwise see, so we can't claim nothing was found.
   */
  hasFilters: boolean
  onClearFilters: () => void
}

export const EmptyAdvisor = ({
  categoryFilters,
  hasFilters,
  onClearFilters,
}: EmptyAdvisorProps) => {
  const singleCategory = categoryFilters.length === 1 ? categoryFilters[0] : undefined
  const canClearFilters = hasFilters || categoryFilters.length > 0

  const getCopy = () => {
    if (hasFilters) {
      return {
        heading: 'No items found',
        message: 'No advisor items match your current filters',
      }
    }

    if (singleCategory) return emptyCopyByCategory[singleCategory]

    return { heading: 'No issues detected', message: 'Congrats! There are no issues detected' }
  }

  const { heading, message } = getCopy()

  return (
    <div className="h-full px-6 flex flex-col items-center justify-center w-full gap-y-2">
      <TextSearch className="text-foreground-muted" strokeWidth={1} />
      <div className="flex flex-col items-center gap-y-0.5 text-center">
        <h3 className="heading-default">{heading}</h3>
        <p className="text-foreground-light text-sm text-balance">{message}</p>
      </div>
      {canClearFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  )
}
