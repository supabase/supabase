'use client'

import { Select, Input, cn } from 'ui'
import Panel from '~/components/Panel'
import CalloutCard from '../components/CalloutCard'
import type { CalculatorInputs, CurrentInfrastructure } from '~/lib/pricing-calculator'

const INFRA_OPTIONS: { value: CurrentInfrastructure; label: string }[] = [
  { value: 'starting_fresh', label: 'Starting fresh' },
  { value: 'firebase', label: 'Firebase' },
  { value: 'aws_self_hosted', label: 'AWS/self-hosted' },
  { value: 'auth0_plus_db', label: 'Auth0 + separate database' },
  { value: 'other', label: 'Other' },
]

export default function Stage1ProjectBasics({
  inputs,
  onChange,
}: {
  inputs: CalculatorInputs
  onChange: (next: CalculatorInputs) => void
}) {
  const set = (patch: Partial<CalculatorInputs>) => onChange({ ...inputs, ...patch })

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Panel outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-2">
          <label className="text-foreground text-sm">Number of projects</label>
          <Input
            type="number"
            size="small"
            layout="vertical"
            value={String(inputs.projects)}
            onChange={(e: any) => set({ projects: Math.max(1, Number(e.target.value || 1)) })}
          />
          <p className="text-foreground-lighter text-xs">Most users need 1–3 (dev/staging/prod).</p>
        </Panel>

        <Panel outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-2">
          <label className="text-foreground text-sm">Current infrastructure</label>
          <Select
            id="current-infra"
            name="Current infrastructure"
            layout="vertical"
            value={inputs.currentInfrastructure}
            onChange={(e: any) => set({ currentInfrastructure: e.target.value })}
          >
            {INFRA_OPTIONS.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
          <p className="text-foreground-lighter text-xs">
            Are you starting with a fresh project or migrating?
          </p>
        </Panel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Panel outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-2">
          <label className="text-foreground text-sm">Team size</label>
          <Input
            type="number"
            size="small"
            layout="vertical"
            value={String(inputs.teamSize)}
            onChange={(e: any) => set({ teamSize: Math.max(1, Number(e.target.value || 1)) })}
          />
          <p className="text-foreground-lighter text-xs">
            Developers working on backend/infrastructure.
          </p>
        </Panel>

        <Panel outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-2">
          <label className="text-foreground text-sm">Average hourly developer cost</label>
          <Input
            type="number"
            size="small"
            layout="vertical"
            value={String(inputs.hourlyCostUsd)}
            onChange={(e: any) => set({ hourlyCostUsd: Math.max(0, Number(e.target.value || 0)) })}
          />
          <p className="text-foreground-lighter text-xs">
            Default $150/hour (US). Used for time savings.
          </p>
        </Panel>
      </div>

      <Panel outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-2">
        <label className="text-foreground text-sm">Compliance needs</label>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={inputs.needCompliance}
            onChange={(e) => set({ needCompliance: e.target.checked })}
            className={cn('h-4 w-4')}
          />
          <span className="text-foreground-lighter text-sm">
            SOC2 / HIPAA / compliance requirements indicated
          </span>
        </div>
      </Panel>

      {/* Integrated ROI messaging */}
      {inputs.currentInfrastructure === 'firebase' && (
        <CalloutCard
          title="Key consideration"
          body="Firebase users typically see 60-80% cost reduction at scale due to Supabase's predictable pricing vs per-operation charges."
        />
      )}
      {inputs.currentInfrastructure === 'aws_self_hosted' && (
        <CalloutCard
          title="Key consideration"
          body="Teams managing their own Postgres typically spend 40-100 hours/month on DevOps. Supabase eliminates most of this."
        />
      )}
      {inputs.projects >= 3 && (
        <CalloutCard
          title="Key consideration"
          body="Multi-project setups benefit from Supabase's unified dashboard and consolidated billing. No more juggling separate services."
        />
      )}
    </div>
  )
}
