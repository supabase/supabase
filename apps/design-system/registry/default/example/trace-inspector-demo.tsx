import { useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from 'ui'
import { Trace } from 'ui-patterns/Trace'

import { createSampleTrace } from './trace-sample'

const sample = createSampleTrace()

const OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'span-0001', label: 'Root' },
  { id: 'span-0008', label: 'Error' },
  { id: 'span-0016', label: 'Running' },
]

export default function TraceInspectorDemo() {
  const [selectedId, setSelectedId] = useState('span-0008')

  return (
    <div className="flex w-full flex-col gap-4">
      <ToggleGroup
        type="single"
        variant="segmented"
        tone="text"
        value={selectedId}
        onValueChange={(value) => setSelectedId(value)}
        allowDeselect={false}
        aria-label="Inspected span"
      >
        {OPTIONS.map((option) => (
          <ToggleGroupItem key={option.id} value={option.id}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Trace.Root
        trace={sample}
        selectedId={selectedId === 'none' ? null : selectedId}
        onSelectedIdChange={(id) => setSelectedId(id ?? 'none')}
      >
        <Trace.Inspector className="h-[420px] w-full max-w-md rounded-md border" />
      </Trace.Root>
    </div>
  )
}
