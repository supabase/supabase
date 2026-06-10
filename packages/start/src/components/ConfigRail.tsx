'use client'

import { useMemo } from 'react'
import { Switch } from 'ui'

import {
  FRAMEWORKS,
  ORMS,
  PRIM_ORDER,
  PRIMITIVES,
  type FrameworkId,
  type OrmId,
  type PrimitiveId,
  type StartConfig,
} from '../lib/config'
import { groupFeaturesByCategory } from '../lib/feature-grouping'
import { type StartFeature } from '../lib/features'
import { Chips, Field, RadioList, SegmentedControl } from './railControls'

interface ConfigRailProps {
  cfg: StartConfig
  features: StartFeature[]
  setValue: <K extends keyof StartConfig>(key: K, value: StartConfig[K]) => void
  togglePrimitive: (id: PrimitiveId) => void
  toggleFeature: (id: string) => void
}

export function ConfigRail({
  cfg,
  features,
  setValue,
  togglePrimitive,
  toggleFeature,
}: ConfigRailProps) {
  const frameworkOptions = Object.values(FRAMEWORKS).map((f) => ({
    id: f.id,
    label: f.label,
    meta: f.meta,
  }))
  const primitiveOptions = PRIM_ORDER.map((p) => ({ id: p, label: PRIMITIVES[p].label }))
  const featureGroups = useMemo(() => groupFeaturesByCategory(features), [features])

  return (
    <aside
      className={[
        'w-full shrink-0 border-b border-default px-6 py-6',
        'lg:sticky lg:top-(--header-height) lg:w-[296px] lg:self-start lg:border-b-0 lg:border-r',
        'lg:h-[calc(100vh-var(--header-height))] lg:overflow-y-auto',
      ].join(' ')}
    >
      <p className="mb-6 text-[13px] leading-relaxed text-foreground-light">
        Tell us what you&apos;re building. Everything on the right — your{' '}
        <span className="font-medium text-foreground">agent plan</span> and the{' '}
        <span className="font-medium text-foreground">setup guide</span> — updates as you choose.
      </p>

      <Field label="Project">
        <SegmentedControl
          options={[
            { id: 'new', label: 'New project', sub: 'scaffold it' },
            { id: 'existing', label: 'Existing', sub: 'add to it' },
          ]}
          value={cfg.project}
          onChange={(v) => setValue('project', v)}
        />
      </Field>

      <Field label="Framework">
        <RadioList
          options={frameworkOptions}
          value={cfg.framework}
          onChange={(v) => setValue('framework', v as FrameworkId)}
        />
      </Field>

      {/* shadcn blocks require a front-end framework. */}
      {cfg.framework !== 'none' && (
        <Field label="Components">
          <label className="flex cursor-pointer items-center gap-3 select-none">
            <Switch checked={cfg.shadcn} onCheckedChange={(v) => setValue('shadcn', v)} />
            <span className="text-sm text-foreground-light">
              shadcn/ui <span className="text-foreground-muted">prebuilt blocks</span>
            </span>
          </label>
        </Field>
      )}

      <Field label="Add the pieces you need" count={`${cfg.primitives.length}/6`}>
        <Chips
          options={primitiveOptions}
          value={cfg.primitives}
          onToggle={(id) => togglePrimitive(id as PrimitiveId)}
        />
      </Field>

      <Field label="Data layer">
        <RadioList
          options={Object.values(ORMS).map((o) => ({ id: o.id, label: o.label, meta: o.meta }))}
          value={cfg.orm}
          onChange={(v) => setValue('orm', v as OrmId)}
        />
      </Field>

      <Field label="Where it runs">
        <SegmentedControl
          options={[
            { id: 'remote', label: 'Remote', sub: 'hosted' },
            { id: 'local', label: 'Local', sub: 'Docker' },
          ]}
          value={cfg.connection}
          onChange={(v) => setValue('connection', v)}
        />
      </Field>

      <Field label="Agent">
        <SegmentedControl
          options={[
            { id: 'claude', label: 'Claude Code', sub: 'plugin' },
            { id: 'codex', label: 'Codex', sub: 'plugin' },
          ]}
          value={cfg.agent}
          onChange={(v) => setValue('agent', v)}
        />
      </Field>

      <Field
        label="Additional features"
        count={cfg.features.length ? `${cfg.features.length} on` : undefined}
      >
        <div className="flex flex-col gap-3.5">
          {featureGroups.map((group) => (
            <div key={group.category}>
              <p className="mb-1.5 text-[11px] text-foreground-muted">{group.category}</p>
              <Chips
                options={group.features.map((f) => ({ id: f.id, label: f.name }))}
                value={cfg.features}
                onToggle={toggleFeature}
              />
            </div>
          ))}
        </div>
        <p className="mt-2.5 text-[11.5px] leading-snug text-foreground-muted">
          Each one switches on the services it needs.
        </p>
      </Field>
    </aside>
  )
}
