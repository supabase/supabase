'use client'

import * as React from 'react'
import { ToggleGroup, ToggleGroupIndicator, ToggleGroupItem } from 'ui'

export default function SegmentedControlViewState() {
  const [view, setView] = React.useState('table')

  return (
    <ToggleGroup
      type="single"
      variant="segmented"
      size="tiny"
      value={view}
      onValueChange={setView}
      allowDeselect={false}
      aria-label="Result view"
    >
      <ToggleGroupIndicator />
      <ToggleGroupItem value="table">Table</ToggleGroupItem>
      <ToggleGroupItem value="chart">Chart</ToggleGroupItem>
    </ToggleGroup>
  )
}
