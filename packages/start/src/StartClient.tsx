'use client'

import { useMemo, useState } from 'react'
import { copyToClipboard } from 'ui'

import { AgentPlanSheet } from './components/AgentPlanSheet'
import { ConfigRail } from './components/ConfigRail'
import { SetupGuide } from './components/SetupGuide'
import { StartHero } from './components/StartHero'
import { buildAgentPlan } from './lib/agent-plan'
import { DEFAULT_CONFIG, FRAMEWORKS, type PrimitiveId, type StartConfig } from './lib/config'
import { indexFeatures, type StartFeature } from './lib/features'
import { buildSteps } from './lib/steps'

export default function StartClient({ features }: { features: StartFeature[] }) {
  const [cfg, setCfg] = useState<StartConfig>(DEFAULT_CONFIG)
  const [planOpen, setPlanOpen] = useState(false)
  const [agentCopied, setAgentCopied] = useState(false)

  const featureMap = useMemo(() => indexFeatures(features), [features])
  const steps = useMemo(() => buildSteps(cfg, features), [cfg, features])
  const plan = useMemo(() => buildAgentPlan(cfg, features), [cfg, features])

  const setValue = <K extends keyof StartConfig>(key: K, value: StartConfig[K]) =>
    setCfg((c) => {
      const next = { ...c, [key]: value }
      // Backend-only has no front-end to drop shadcn blocks into.
      if (key === 'framework' && value === 'none') next.shadcn = false
      return next
    })

  const togglePrimitive = (id: PrimitiveId) =>
    setCfg((c) => ({
      ...c,
      primitives: c.primitives.includes(id)
        ? c.primitives.filter((p) => p !== id)
        : [...c.primitives, id],
    }))

  // Toggling a feature on also switches on the primitives (and dependent
  // feature templates) it needs, mirroring the prototype's behaviour.
  const toggleFeature = (id: string) =>
    setCfg((c) => {
      const isOn = c.features.includes(id)
      if (isOn) {
        return { ...c, features: c.features.filter((f) => f !== id) }
      }
      const feature = featureMap[id]
      const features = [...c.features, id]
      const dependents = feature?.neededFeatureIds.filter((d) => !features.includes(d)) ?? []
      return {
        ...c,
        features: [...features, ...dependents],
        primitives: [...new Set([...c.primitives, ...(feature?.neededPrimitives ?? [])])],
      }
    })

  const onCopyPlan = () => {
    copyToClipboard(plan, () => {
      setAgentCopied(true)
      setTimeout(() => setAgentCopied(false), 4000)
    })
  }

  return (
    <div className="flex flex-col lg:flex-row">
      <ConfigRail
        cfg={cfg}
        features={features}
        setValue={setValue}
        togglePrimitive={togglePrimitive}
        toggleFeature={toggleFeature}
      />

      <main className="flex flex-1 justify-center px-6 py-12 lg:px-12 lg:py-14">
        <div className="w-full max-w-[680px]">
          <StartHero
            cfg={cfg}
            features={features}
            agentCopied={agentCopied}
            onCopyPlan={onCopyPlan}
            onViewPlan={() => setPlanOpen(true)}
          />
          <hr className="my-11 border-default" />
          <SetupGuide steps={steps} frameworkLabel={FRAMEWORKS[cfg.framework].label} />
        </div>
      </main>

      <AgentPlanSheet open={planOpen} plan={plan} onOpenChange={setPlanOpen} />
    </div>
  )
}
