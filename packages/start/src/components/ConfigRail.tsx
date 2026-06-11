'use client'

import { Plus } from 'lucide-react'
import { Button, CheckboxGroupStacked } from 'ui'

import { canRemoveTemplate, type DependencyResolution } from '../lib/composition/composition'
import { FRAMEWORKS, ORMS, type FrameworkId, type OrmId, type StartConfig } from '../lib/config'
import type { Template } from '../lib/template-catalog'
import { ConfigRailOutcomeFooter } from './ConfigRailOutcomeFooter'
import { CoreTemplateCheckbox } from './CoreTemplateCheckbox'
import { RailFormField, RailRadioField } from './railControls'

interface ConfigRailProps {
  cfg: StartConfig
  templates: Template[]
  coreTemplates: Template[]
  selectedIds: Set<string>
  resolution: DependencyResolution
  featureCount: number
  hasComposition: boolean
  plan: string
  setValue: <K extends keyof StartConfig>(key: K, value: StartConfig[K]) => void
  onAddTemplate: (id: string) => void
  onRemoveTemplate: (id: string) => void
  onHoverTemplate: (id: string | null) => void
  onOpenFeatures: () => void
  onDownload: () => void
  onOpenManual: () => void
  onOpenAgentPlan: () => void
}

export function ConfigRail({
  cfg,
  templates,
  coreTemplates,
  selectedIds,
  resolution,
  featureCount,
  hasComposition,
  plan,
  setValue,
  onAddTemplate,
  onRemoveTemplate,
  onHoverTemplate,
  onOpenFeatures,
  onDownload,
  onOpenManual,
  onOpenAgentPlan,
}: ConfigRailProps) {
  const frameworkOptions = Object.values(FRAMEWORKS).map((f) => ({
    id: f.id,
    label: f.label,
    meta: f.meta,
  }))
  const resolvedIds = new Set(resolution.resolved.map((template) => template.id))
  const selectedCoreCount = coreTemplates.filter(
    (template) => selectedIds.has(template.id) || resolvedIds.has(template.id)
  ).length

  return (
    <aside
      className={[
        'flex h-full w-full shrink-0 flex-col overflow-hidden border-b border-default',
        'lg:border-b',
      ].join(' ')}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="prose prose-docs mb-5 max-w-none text-base text-foreground-light">
          <h2 className="mb-0 text-base text-foreground">Compose your project</h2>
          <p className="!mt-1">Pick your back-end pieces and connect them to your front-end.</p>
        </div>

        <RailRadioField
          label="Project"
          options={[
            { id: 'new', label: 'New project', meta: 'Scaffold it' },
            { id: 'existing', label: 'Existing', meta: 'Add to it' },
          ]}
          value={cfg.project}
          onChange={(v) => setValue('project', v)}
        />

        <RailRadioField
          label="Framework"
          options={frameworkOptions}
          value={cfg.framework}
          onChange={(v) => setValue('framework', v as FrameworkId)}
        />

        {cfg.framework !== 'none' && (
          <RailRadioField
            label="Component library"
            options={[
              {
                id: 'shadcn',
                label: 'shadcn/ui',
                meta: 'Prebuilt UI blocks for your framework',
              },
              {
                id: 'none',
                label: 'None',
                meta: 'Use your own components',
              },
            ]}
            value={cfg.shadcn ? 'shadcn' : 'none'}
            onChange={(v) => setValue('shadcn', v === 'shadcn')}
            idPrefix="component-library"
          />
        )}

        <RailFormField
          label="Add the pieces you need"
          labelOptional={`${selectedCoreCount}/${coreTemplates.length}`}
        >
          <CheckboxGroupStacked>
            {coreTemplates.map((template) => {
              const isSelected = selectedIds.has(template.id)
              const isAutoIncluded = !isSelected && resolvedIds.has(template.id)
              const isRemovalBlocked =
                isSelected && !canRemoveTemplate(template.id, selectedIds, templates)

              return (
                <CoreTemplateCheckbox
                  key={template.id}
                  template={template}
                  templates={templates}
                  selectedIds={selectedIds}
                  isSelected={isSelected}
                  isAutoIncluded={isAutoIncluded}
                  isRemovalBlocked={isRemovalBlocked}
                  onAdd={() => onAddTemplate(template.id)}
                  onRemove={() => onRemoveTemplate(template.id)}
                  onHoverChange={(isHovered) => onHoverTemplate(isHovered ? template.id : null)}
                />
              )
            })}
          </CheckboxGroupStacked>
        </RailFormField>

        <RailRadioField
          label="Data layer"
          options={Object.values(ORMS).map((o) => ({ id: o.id, label: o.label, meta: o.meta }))}
          value={cfg.orm}
          onChange={(v) => setValue('orm', v as OrmId)}
        />

        <RailRadioField
          label="Where it runs"
          options={[
            { id: 'remote', label: 'Remote', meta: 'Hosted' },
            { id: 'local', label: 'Local', meta: 'Docker' },
          ]}
          value={cfg.connection}
          onChange={(v) => setValue('connection', v)}
        />

        <RailRadioField
          label="Agent"
          options={[
            { id: 'claude', label: 'Claude Code', meta: 'Plugin' },
            { id: 'codex', label: 'Codex', meta: 'Plugin' },
          ]}
          value={cfg.agent}
          onChange={(v) => setValue('agent', v)}
        />

        <RailFormField
          label="Add features"
          labelOptional={featureCount ? `${featureCount} on` : undefined}
        >
          <Button
            type="default"
            block
            iconRight={<Plus className="h-4 w-4" />}
            onClick={onOpenFeatures}
          >
            Select feature templates
          </Button>
        </RailFormField>
      </div>

      <ConfigRailOutcomeFooter
        plan={plan}
        hasComposition={hasComposition}
        onDownload={onDownload}
        onOpenManual={onOpenManual}
        onOpenAgentPlan={onOpenAgentPlan}
      />
    </aside>
  )
}
