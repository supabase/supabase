import { CheckIcon } from 'lucide-react'
import { Button } from 'ui'

import {
  EDGE_FUNCTION_CHART_INTERVALS,
  getSegmentedButtonClassName,
} from './EdgeFunctionOverview.utils'

interface EdgeFunctionIntervalSelectorProps {
  interval: string
  onIntervalChange: (interval: string) => void
}

export const EdgeFunctionIntervalSelector = ({
  interval,
  onIntervalChange,
}: EdgeFunctionIntervalSelectorProps) => (
  <div className="flex items-center">
    {EDGE_FUNCTION_CHART_INTERVALS.map((item, index) => (
      <Button
        key={`function-filter-${item.key}`}
        variant={interval === item.key ? 'secondary' : 'default'}
        aria-pressed={interval === item.key}
        onClick={() => onIntervalChange(item.key)}
        className={getSegmentedButtonClassName(index, EDGE_FUNCTION_CHART_INTERVALS.length)}
      >
        {interval === item.key && (
          <CheckIcon size={12} aria-hidden="true" data-testid="selected-period-indicator" />
        )}
        {item.label}
      </Button>
    ))}
  </div>
)
