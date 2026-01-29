'use client'

import { FileText, ShoppingCart, LayoutDashboard, Users, MessageSquare, Zap } from 'lucide-react'
import { Slider_Shadcn_, Select, Input, cn } from 'ui'
import Panel from '~/components/Panel'
import CalloutCard from '../components/CalloutCard'
import type { AppType, CalculatorInputs, ProjectionPeriodMonths } from '~/lib/pricing-calculator'

const APP_TYPE_OPTIONS: {
  value: AppType
  label: string
  description: string
  icon: typeof FileText
  readsPerMau: number
}[] = [
  {
    value: 'content',
    label: 'Content/Marketing',
    description: 'Blogs, landing pages, docs',
    icon: FileText,
    readsPerMau: 100,
  },
  {
    value: 'ecommerce',
    label: 'E-commerce',
    description: 'Product catalogs, checkout',
    icon: ShoppingCart,
    readsPerMau: 300,
  },
  {
    value: 'saas',
    label: 'SaaS/Dashboard',
    description: 'Analytics, admin panels',
    icon: LayoutDashboard,
    readsPerMau: 500,
  },
  {
    value: 'social',
    label: 'Social/UGC',
    description: 'Feeds, comments, likes',
    icon: Users,
    readsPerMau: 2000,
  },
  {
    value: 'collaboration',
    label: 'Collaboration',
    description: 'Chat, docs, whiteboards',
    icon: MessageSquare,
    readsPerMau: 5000,
  },
  {
    value: 'realtime',
    label: 'Realtime/Gaming',
    description: 'Multiplayer, live events',
    icon: Zap,
    readsPerMau: 10000,
  },
]

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
            <p className="text-foreground-lighter text-xs">Default 10% (typical for early-stage products; mature products often see 2-5%)</p>
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
            <p className="text-foreground-lighter text-xs">Default 1 GB/month (varies widely by use case; content-heavy apps grow faster)</p>
          </div>
          <Input
            type="number"
            size="small"
            layout="vertical"
            value={String(inputs.dataGrowthGbPerMonth)}
            onChange={(e: any) => set({ dataGrowthGbPerMonth: clamp(Number(e.target.value || 0), 0, 100_000) })}
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
          onChange={(e: any) => set({ projectionMonths: Number(e.target.value) as ProjectionPeriodMonths })}
        >
          <Select.Option value="12">12 months</Select.Option>
          <Select.Option value="36">36 months</Select.Option>
        </Select>
      </Panel>

      <Panel outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-foreground text-sm font-medium">What type of app are you building?</p>
          <p className="text-foreground-lighter text-xs">
            Used to estimate database reads/writes, API calls, and function invocations per user. These are rough approximations - a realtime app may trigger 100x more operations than a content site.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {APP_TYPE_OPTIONS.map((option) => {
            const Icon = option.icon
            const isSelected = inputs.appType === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => set({ appType: option.value })}
                className={cn(
                  'flex flex-col items-start gap-1 p-3 rounded-md border text-left transition-colors',
                  isSelected
                    ? 'border-brand bg-brand-200/10'
                    : 'border-default bg-surface-100 hover:border-foreground-muted'
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn(
                      'w-4 h-4',
                      isSelected ? 'text-brand' : 'text-foreground-muted'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-brand' : 'text-foreground'
                    )}
                  >
                    {option.label}
                  </span>
                </div>
                <span className="text-xs text-foreground-lighter">{option.description}</span>
              </button>
            )
          })}
        </div>
      </Panel>

      <CalloutCard
        title="Pricing model comparison"
        body="Consumption-based pricing (pay-per-operation) can compound quickly with growth. Subscription models like Supabase's offer more predictable budgeting, though you pay for included capacity whether you use it or not."
      />
    </div>
  )
}

