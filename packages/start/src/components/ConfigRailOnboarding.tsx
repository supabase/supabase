'use client'

import { ChevronLeft } from 'lucide-react'
import { Button, CheckboxGroupStacked } from 'ui'

import { canRemoveTemplate, type DependencyResolution } from '../lib/composition/composition'
import { FRAMEWORKS, ORMS, type FrameworkId, type OrmId, type StartConfig } from '../lib/config'
import type { ConfigRailStepMeta } from '../lib/config-rail-steps'
import { groupTemplatesByCategory, sortCategories, type Template } from '../lib/template-catalog'
import { ConfigRailOutcomeActions, ConfigRailStickyFooter } from './ConfigRailOutcomeActions'
import { CoreTemplateCheckbox } from './CoreTemplateCheckbox'
import { RailRadioOptions } from './railControls'
import { ReadyStepIllustration } from './ReadyStepIllustration'
import { TemplateItem } from './templates/TemplateBrowser'

interface ConfigRailOnboardingProps {
  step: ConfigRailStepMeta
  stepIndex: number
  cfg: StartConfig
  templates: Template[]
  coreTemplates: Template[]
  featureTemplates: Template[]
  selectedIds: Set<string>
  resolution: DependencyResolution
  activeDetailTemplateId: string | null
  setValue: <K extends keyof StartConfig>(key: K, value: StartConfig[K]) => void
  onAddTemplate: (id: string) => void
  onRemoveTemplate: (id: string) => void
  onHoverTemplate: (id: string | null) => void
  onOpenTemplate: (id: string) => void
  plan: string
  hasComposition: boolean
  onOpenManual: () => void
  onOpenAgentPlan: () => void
  onBack: () => void
  onContinue: () => void
  onKeepEditing: () => void
}

export function ConfigRailOnboarding({
  step,
  stepIndex,
  cfg,
  templates,
  coreTemplates,
  featureTemplates,
  selectedIds,
  resolution,
  activeDetailTemplateId,
  setValue,
  onAddTemplate,
  onRemoveTemplate,
  onHoverTemplate,
  onOpenTemplate,
  plan,
  hasComposition,
  onOpenManual,
  onOpenAgentPlan,
  onBack,
  onContinue,
  onKeepEditing,
}: ConfigRailOnboardingProps) {
  const frameworkOptions = Object.values(FRAMEWORKS).map((f) => ({
    id: f.id,
    label: f.label,
    meta: f.meta,
  }))
  const resolvedIds = new Set(resolution.resolved.map((template) => template.id))
  const selectedCoreCount = coreTemplates.filter(
    (template) => selectedIds.has(template.id) || resolvedIds.has(template.id)
  ).length
  const isReadyStep = step.id === 'ready'
  const templatesByCategory = groupTemplatesByCategory(featureTemplates)
  const featureCategories = sortCategories(Object.keys(templatesByCategory))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
        <div className="flex min-h-full flex-col justify-end">
          <div className="space-y-6">
            <div>
              {isReadyStep && <ReadyStepIllustration />}
              <div className="prose prose-docs max-w-none text-base text-foreground-light">
                <h2 className="mb-0 text-base text-foreground">{step.title}</h2>
                <p className="!mt-1">{step.description}</p>
              </div>
            </div>

            {step.id === 'project' && (
              <RailRadioOptions
                options={[
                  { id: 'new', label: 'New project', meta: 'Scaffold it' },
                  { id: 'existing', label: 'Existing', meta: 'Add to it' },
                ]}
                value={cfg.project}
                onChange={(v) => setValue('project', v)}
                idPrefix="project"
              />
            )}

            {step.id === 'framework' && (
              <RailRadioOptions
                options={frameworkOptions}
                value={cfg.framework}
                onChange={(v) => setValue('framework', v as FrameworkId)}
                idPrefix="framework"
              />
            )}

            {step.id === 'component-library' && (
              <RailRadioOptions
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

            {step.id === 'primitives' && (
              <div>
                {selectedCoreCount > 0 && (
                  <p className="mb-3 text-xs text-foreground-lighter">
                    {selectedCoreCount} of {coreTemplates.length} selected
                  </p>
                )}
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
                        onHoverChange={(isHovered) =>
                          onHoverTemplate(isHovered ? template.id : null)
                        }
                      />
                    )
                  })}
                </CheckboxGroupStacked>
              </div>
            )}

            {step.id === 'data-layer' && (
              <RailRadioOptions
                options={Object.values(ORMS).map((o) => ({
                  id: o.id,
                  label: o.label,
                  meta: o.meta,
                }))}
                value={cfg.orm}
                onChange={(v) => setValue('orm', v as OrmId)}
                idPrefix="data-layer"
              />
            )}

            {step.id === 'connection' && (
              <RailRadioOptions
                options={[
                  { id: 'remote', label: 'Remote', meta: 'Hosted' },
                  { id: 'local', label: 'Local', meta: 'Docker' },
                ]}
                value={cfg.connection}
                onChange={(v) => setValue('connection', v)}
                idPrefix="connection"
              />
            )}

            {step.id === 'agent' && (
              <RailRadioOptions
                options={[
                  { id: 'claude', label: 'Claude Code', meta: 'Plugin' },
                  { id: 'codex', label: 'Codex', meta: 'Plugin' },
                ]}
                value={cfg.agent}
                onChange={(v) => setValue('agent', v)}
                idPrefix="agent"
              />
            )}

            {step.id === 'features' && (
              <div className="space-y-6">
                {featureCategories.map((category) => (
                  <div key={category}>
                    <p className="mb-2 text-xs font-mono uppercase tracking-wide text-foreground-light">
                      {category}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {templatesByCategory[category].map((template) => {
                        const isSelected = selectedIds.has(template.id)
                        const isAutoIncluded = !isSelected && resolvedIds.has(template.id)
                        const isRemovalBlocked =
                          isSelected && !canRemoveTemplate(template.id, selectedIds, templates)

                        return (
                          <TemplateItem
                            key={template.id}
                            template={template}
                            templates={templates}
                            selectedIds={selectedIds}
                            resolvedIds={resolvedIds}
                            isSelected={isSelected}
                            isActiveDetail={activeDetailTemplateId === template.id}
                            isAutoIncluded={isAutoIncluded}
                            isRemovalBlocked={isRemovalBlocked}
                            onOpen={() => onOpenTemplate(template.id)}
                            onAdd={() => onAddTemplate(template.id)}
                            onRemove={() => onRemoveTemplate(template.id)}
                            onHoverChange={(isHovered) =>
                              onHoverTemplate(isHovered ? template.id : null)
                            }
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isReadyStep ? (
        <ConfigRailStickyFooter>
          <ConfigRailOutcomeActions
            plan={plan}
            hasComposition={hasComposition}
            onOpenManual={onOpenManual}
            onOpenAgentPlan={onOpenAgentPlan}
          />
          <Button type="text" block onClick={onKeepEditing}>
            Keep editing
          </Button>
        </ConfigRailStickyFooter>
      ) : (
        <ConfigRailStickyFooter>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <Button
                type="default"
                className="shrink-0 px-2.5"
                icon={<ChevronLeft />}
                aria-label="Previous step"
                onClick={onBack}
              />
            )}
            <Button type="primary" block onClick={onContinue}>
              Continue
            </Button>
          </div>
        </ConfigRailStickyFooter>
      )}
    </div>
  )
}
