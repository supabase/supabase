'use client'

import { Slider_Shadcn_, Select, Input } from 'ui'
import Panel from '~/components/Panel'
import CalloutCard from '../components/CalloutCard'
import type { CalculatorInputs, ProjectionPeriodMonths } from '~/lib/pricing-calculator'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export default function Stage3Growth({
  inputs,
  onChange,
}: {
  inputs: CalculatorInputs
  onChange: (next: CalculatorInputs) => void
}) {
  const set = (patch: Partial<CalculatorInputs>) => onChange({ ...inputs, ...patch })

  return (
    <div className="flex flex-col gap-4">
      <Panel outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <p className="text-foreground text-sm font-medium">Expected monthly user growth rate</p>
            <p className="text-foreground-lighter text-xs">Default 10%</p>
          </div>
          <Input
            type="number"
            size="small"
            layout="vertical"
            value={String(inputs.userGrowthRateMonthlyPct)}
            onChange={(e: any) =>
              set({ userGrowthRateMonthlyPct: clamp(Number(e.target.value || 0), 0, 50) })
            }
            className="max-w-[120px]"
          />
        </div>
        <Slider_Shadcn_
          value={[inputs.userGrowthRateMonthlyPct]}
          min={0}
          max={50}
          step={1}
          onValueChange={(v) => set({ userGrowthRateMonthlyPct: v[0] })}
        />
      </Panel>

      <Panel outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <p className="text-foreground text-sm font-medium">Expected monthly data growth (GB)</p>
            <p className="text-foreground-lighter text-xs">Default 1 GB/month</p>
          </div>
          <Input
            type="number"
            size="small"
            layout="vertical"
            value={String(inputs.dataGrowthGbPerMonth)}
            onChange={(e: any) =>
              set({ dataGrowthGbPerMonth: clamp(Number(e.target.value || 0), 0, 100_000) })
            }
            className="max-w-[140px]"
          />
        </div>
        <Slider_Shadcn_
          value={[inputs.dataGrowthGbPerMonth]}
          min={0}
          max={50}
          step={1}
          onValueChange={(v) => set({ dataGrowthGbPerMonth: v[0] })}
        />
      </Panel>

      <Panel outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-2">
        <p className="text-foreground text-sm font-medium">Projection period</p>
        <Select
          id="projection-months"
          name="Projection months"
          layout="vertical"
          value={String(inputs.projectionMonths)}
          onChange={(e: any) =>
            set({ projectionMonths: Number(e.target.value) as ProjectionPeriodMonths })
          }
        >
          <Select.Option value="12">12 months</Select.Option>
          <Select.Option value="36">36 months</Select.Option>
        </Select>
      </Panel>

      <CalloutCard
        title="Key consideration"
        body="With consumption-based pricing, costs compound with growth. Supabase's tiered model keeps costs predictable."
      />
    </div>
  )
}
