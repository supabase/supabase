import { Button } from 'ui'

import {
  EDGE_FUNCTION_CHART_INTERVALS,
  getSegmentedButtonClassName,
} from './EdgeFunctionOverview.utils'

interface EdgeFunctionIntervalSelectorProps {
  interval: string
  onIntervalChange: (interval: string) => void
}

/** Segmented control for the period every Overview chart covers */
export const EdgeFunctionIntervalSelector = ({
  interval,
  onIntervalChange,
}: EdgeFunctionIntervalSelectorProps) => (
  <div className="flex items-center">
    {EDGE_FUNCTION_CHART_INTERVALS.map((item, index) => (
      <Button
        key={`function-filter-${item.key}`}
        variant={interval === item.key ? 'secondary' : 'default'}
        onClick={() => onIntervalChange(item.key)}
        className={getSegmentedButtonClassName(index, EDGE_FUNCTION_CHART_INTERVALS.length)}
      >
        {item.label}
      </Button>
    ))}
  </div>
)
