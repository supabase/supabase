'use client'

import * as React from 'react'
import { ToggleGroup, ToggleGroupItem } from 'ui'

const SIZES = ['tiny', 'sm', 'default', 'lg'] as const

export default function ToggleGroupSegmentedFilter() {
  const [status, setStatus] = React.useState('all')

  return (
    <div className="flex flex-col gap-4">
      {SIZES.map((size) => (
        <div key={size} className="flex items-center gap-4">
          <span className="w-16 shrink-0 text-xs text-foreground-lighter">{size}</span>
          <ToggleGroup
            type="single"
            variant="segmented"
            size={size}
            value={status}
            onValueChange={setStatus}
            allowDeselect={false}
            aria-label={`Filter keys by status (${size})`}
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="active">Active</ToggleGroupItem>
            <ToggleGroupItem value="revoked">Revoked</ToggleGroupItem>
          </ToggleGroup>
        </div>
      ))}
    </div>
  )
}
