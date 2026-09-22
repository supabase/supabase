'use client'

import * as React from 'react'
import { ToggleGroup, ToggleGroupIndicator, ToggleGroupItem } from 'ui'

export default function SegmentedControlFilter() {
  const [status, setStatus] = React.useState('all')

  return (
    <ToggleGroup
      type="single"
      variant="segmented"
      size="tiny"
      value={status}
      onValueChange={setStatus}
      allowDeselect={false}
      aria-label="Filter keys by status"
    >
      <ToggleGroupIndicator />
      <ToggleGroupItem value="all">All</ToggleGroupItem>
      <ToggleGroupItem value="active">Active</ToggleGroupItem>
      <ToggleGroupItem value="revoked">Revoked</ToggleGroupItem>
    </ToggleGroup>
  )
}
