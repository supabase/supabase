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
import { buildStartComposition, CORE_TEMPLATE_IDS } from './lib/composition/start-composition'
import { FRAMEWORKS } from './lib/config'
import type { StartConfigState } from './lib/start-config-state'
import { buildSteps } from './lib/steps'
import type { Template } from './lib/template-catalog'

type SidebarView = 'config' | 'features'

interface StartClientProps {
  templates: Template[]
  configState: StartConfigState
}

export default function StartClient({ templates, configState }: StartClientProps) {
  const { cfg, setValue, addTemplate, removeTemplate } = configState
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
