'use client'

import * as React from 'react'
import { ToggleGroup, ToggleGroupItem } from 'ui'

export default function ToggleGroupSegmentedFilter() {
  const [status, setStatus] = React.useState('all')

  return (
    <ToggleGroup
      type="single"
      variant="segmented"
      value={status}
      onValueChange={setStatus}
      allowDeselect={false}
      aria-label="Filter keys by status"
    >
      <ToggleGroupItem value="all">All</ToggleGroupItem>
      <ToggleGroupItem value="active">Active</ToggleGroupItem>
      <ToggleGroupItem value="revoked">Revoked</ToggleGroupItem>
    </ToggleGroup>
  )
}
