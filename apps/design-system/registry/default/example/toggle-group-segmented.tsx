'use client'

import * as React from 'react'
import { ToggleGroup, ToggleGroupIndicator, ToggleGroupItem } from 'ui'

export default function ToggleGroupSegmented() {
  const [view, setView] = React.useState('data')

  return (
    <ToggleGroup
      type="single"
      variant="segmented"
      size="tiny"
      value={view}
      onValueChange={setView}
      allowDeselect={false}
      aria-label="Table view"
    >
      <ToggleGroupIndicator />
      <ToggleGroupItem value="data">Data</ToggleGroupItem>
      <ToggleGroupItem value="definition">Definition</ToggleGroupItem>
    </ToggleGroup>
  )
}
