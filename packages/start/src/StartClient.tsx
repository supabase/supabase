'use client'

import { useMemo, useState } from 'react'

import { AgentPlanSheet } from './components/AgentPlanSheet'
import { CompositionStage } from './components/CompositionStage'
import { ConfigRail } from './components/ConfigRail'
import { SetupGuideSheet } from './components/SetupGuideSheet'
import { TemplateBrowser } from './components/templates/TemplateBrowser'
import { TemplateDetailSheet } from './components/templates/TemplateDetailSheet'
import { buildAgentPlan } from './lib/agent-plan'
import { canRemoveTemplate, createZipBlob, downloadBlob } from './lib/composition/composition'
import {
  buildStartComposition,
  CORE_TEMPLATE_IDS,
  getPrimitiveForTemplate,
  getTemplateIdForPrimitive,
} from './lib/composition/start-composition'
import { DEFAULT_CONFIG, FRAMEWORKS, type PrimitiveId, type StartConfig } from './lib/config'
import { buildSteps } from './lib/steps'
import type { Template } from './lib/template-catalog'

type SidebarView = 'config' | 'features'

interface StartClientProps {
  templates: Template[]
}

export default function StartClient({ templates }: StartClientProps) {
  const [cfg, setCfg] = useState<StartConfig>(DEFAULT_CONFIG)
  const [sidebarView, setSidebarView] = useState<SidebarView>('config')
  const [search, setSearch] = useState('')
  const [guideOpen, setGuideOpen] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const [hoveredTemplateId, setHoveredTemplateId] = useState<string | null>(null)
  const [detailTemplateId, setDetailTemplateId] = useState<string | null>(null)

  const composition = useMemo(() => buildStartComposition(cfg, templates), [cfg, templates])
  const steps = useMemo(() => buildSteps(cfg, composition), [cfg, composition])
  const plan = useMemo(() => buildAgentPlan(cfg, composition), [cfg, composition])
  const featureTemplates = useMemo(
    () => templates.filter((template) => !CORE_TEMPLATE_IDS.has(template.id)),
    [templates]
  )
  const coreTemplates = useMemo(
    () => templates.filter((template) => CORE_TEMPLATE_IDS.has(template.id)),
    [templates]
  )
  const defaultSchemaTemplateIds = useMemo(
    () =>
      new Set(
        templates
          .filter(
            (template) =>
              template.defaultEnabled &&
              template.files.some((file) => file.path.startsWith('supabase/schemas/'))
          )
          .map((template) => template.id)
      ),
    [templates]
  )
  const featureCount = useMemo(
    () =>
      cfg.templateIds.filter((id) => featureTemplates.some((template) => template.id === id))
        .length,
    [cfg.templateIds, featureTemplates]
  )
  const detailTemplate = useMemo(
    () => templates.find((template) => template.id === detailTemplateId) ?? null,
    [detailTemplateId, templates]
  )
  const resolvedIds = useMemo(
    () => new Set(composition.resolution.resolved.map((template) => template.id)),
    [composition.resolution.resolved]
  )

  const setValue = <K extends keyof StartConfig>(key: K, value: StartConfig[K]) =>
    setCfg((current) => {
      const next = { ...current, [key]: value }
      if (key === 'framework' && value === 'none') next.shadcn = false
      if (key === 'orm' && value !== 'none') {
        next.templateIds = next.templateIds.filter(
          (templateId) => !defaultSchemaTemplateIds.has(templateId)
        )
      }
      return next
    })

  const addTemplate = (id: string) => {
    const primitive = getCanonicalPrimitiveForTemplate(id)

    setCfg((current) => {
      if (primitive) {
        return current.primitives.includes(primitive)
          ? current
          : { ...current, primitives: [...current.primitives, primitive] }
      }

      return current.templateIds.includes(id)
        ? current
        : { ...current, templateIds: [...current.templateIds, id] }
    })
  }

  const removeTemplate = (id: string) => {
    if (!canRemoveTemplate(id, composition.selectedIds, templates)) return

    const primitive = getCanonicalPrimitiveForTemplate(id)

    setCfg((current) => {
      if (primitive) {
        return {
          ...current,
          primitives: current.primitives.filter((candidate) => candidate !== primitive),
        }
      }

      return {
        ...current,
        templateIds: current.templateIds.filter((templateId) => templateId !== id),
      }
    })
  }

  const downloadComposition = async () => {
    if (!composition.mergeResult) return

    const blob = await createZipBlob(composition.mergeResult)
    downloadBlob(blob, `supabase-start-${composition.mergeResult.compositionId}.zip`)
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-muted/10 lg:flex-row">
      <aside className="min-h-0 w-full shrink-0 overflow-hidden border-b bg-background lg:w-[440px] lg:border-b-0 lg:border-r">
        {sidebarView === 'config' ? (
          <ConfigRail
            cfg={cfg}
            templates={templates}
            coreTemplates={coreTemplates}
            selectedIds={composition.selectedIds}
            resolution={composition.resolution}
            featureCount={featureCount}
            hasComposition={Boolean(composition.mergeResult)}
            plan={plan}
            setValue={setValue}
            onAddTemplate={addTemplate}
            onRemoveTemplate={removeTemplate}
            onHoverTemplate={setHoveredTemplateId}
            onOpenFeatures={() => setSidebarView('features')}
            onDownload={downloadComposition}
            onOpenManual={() => setGuideOpen(true)}
            onOpenAgentPlan={() => setPlanOpen(true)}
          />
        ) : (
          <TemplateBrowser
            templates={featureTemplates}
            allTemplates={templates}
            selectedIds={composition.selectedIds}
            resolution={composition.resolution}
            search={search}
            activeDetailTemplateId={detailTemplateId}
            onSearchChange={setSearch}
            onOpenTemplate={setDetailTemplateId}
            onAddTemplate={addTemplate}
            onRemoveTemplate={removeTemplate}
            onHoverTemplate={setHoveredTemplateId}
            onBack={() => setSidebarView('config')}
          />
        )}
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-hidden bg-background">
        <CompositionStage
          cfg={cfg}
          templates={templates}
          resolution={composition.resolution}
          mergeResult={composition.mergeResult}
          resources={composition.resources}
          hoveredTemplateId={hoveredTemplateId}
        />
      </main>

      <SetupGuideSheet
        open={guideOpen}
        steps={steps}
        frameworkLabel={FRAMEWORKS[cfg.framework].label}
        onOpenChange={setGuideOpen}
      />

      <AgentPlanSheet open={planOpen} plan={plan} onOpenChange={setPlanOpen} />

      <TemplateDetailSheet
        template={detailTemplate}
        selectedIds={composition.selectedIds}
        resolvedIds={resolvedIds}
        onOpenChange={(open) => {
          if (!open) setDetailTemplateId(null)
        }}
        onAdd={() => {
          if (detailTemplate) addTemplate(detailTemplate.id)
        }}
      />
    </div>
  )
}

function getCanonicalPrimitiveForTemplate(templateId: string): PrimitiveId | undefined {
  const primitive = getPrimitiveForTemplate(templateId)
  return primitive && getTemplateIdForPrimitive(primitive) === templateId ? primitive : undefined
}
