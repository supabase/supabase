'use client'

import { useState } from 'react'

import type { DependencyResolution, MergeResult } from '../lib/composition/composition'
import type { CompositionResource } from '../lib/composition/resources'
import type { StartConfig } from '../lib/config'
import type { ConfigRailStepId } from '../lib/config-rail-steps'
import type { Template } from '../lib/template-catalog'
import { CollapsibleCompositionCodePanel } from './files/CollapsibleCompositionCodePanel'
import { CompositionVisualizer } from './visualizer/CompositionVisualizer'

interface CompositionStageProps {
  cfg: StartConfig
  templates: Template[]
  resolution: DependencyResolution
  mergeResult: MergeResult | null
  resources: CompositionResource[]
  hoveredTemplateId: string | null
  onboardingStepId: ConfigRailStepId | null
  onDownload: () => void
}

export function CompositionStage({
  cfg,
  templates,
  resolution,
  mergeResult,
  resources,
  hoveredTemplateId,
  onboardingStepId,
  onDownload,
}: CompositionStageProps) {
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null)

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-muted/10">
      <div className="min-h-0 flex-1">
        <CompositionVisualizer
          cfg={cfg}
          templates={templates}
          resolution={resolution}
          mergeResult={mergeResult}
          resources={resources}
          hoveredTemplateId={hoveredTemplateId}
          onSelectFile={setActiveFilePath}
        />
      </div>

      <CollapsibleCompositionCodePanel
        mergeResult={mergeResult}
        activeFilePath={activeFilePath}
        onActiveFilePathChange={setActiveFilePath}
        onboardingStepId={onboardingStepId}
        onDownload={onDownload}
      />
    </div>
  )
}
