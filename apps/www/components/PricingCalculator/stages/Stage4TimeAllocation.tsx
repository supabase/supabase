'use client'

import { Input } from 'ui'
import Panel from '~/components/Panel'
import type { CalculatorInputs, TimeAllocationKey } from '~/lib/pricing-calculator'

const FIELD_LABELS: Record<TimeAllocationKey, string> = {
  auth: 'Hours per month on authentication',
  database: 'Hours per month on database management',
  api: 'Hours per month on API development',
  devops: 'Hours per month on DevOps',
}

export default function Stage4TimeAllocation({
  inputs,
  onChange,
}: {
  inputs: CalculatorInputs
  onChange: (next: CalculatorInputs) => void
}) {
  const merged = inputs.timeAllocationOverrides ?? {}

  const setOverride = (key: TimeAllocationKey, value: number) => {
    onChange({
      ...inputs,
      timeAllocationOverrides: {
        ...merged,
        [key]: value,
      },
    })
  }

  const clearOverride = (key: TimeAllocationKey) => {
    const next = { ...merged }
    delete (next as any)[key]
    onChange({
      ...inputs,
      timeAllocationOverrides: next,
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {(Object.keys(FIELD_LABELS) as TimeAllocationKey[]).map((key) => (
        <Panel key={key} outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-2">
          <label className="text-foreground text-sm">{FIELD_LABELS[key]}</label>
          <Input
            type="number"
            size="small"
            layout="vertical"
            value={merged[key] == null ? '' : String(merged[key])}
            placeholder="Use default"
            onChange={(e: any) => {
              const raw = e.target.value
              if (raw === '') return clearOverride(key)
              return setOverride(key, Math.max(0, Number(raw)))
            }}
          />
          <p className="text-foreground-lighter text-xs">
            Optional override. Leave blank to use smart defaults.
          </p>
        </Panel>
      ))}
    </div>
  )
}
