'use client'

import { Bot, Check } from 'lucide-react'
import { Button, cn } from 'ui'

import { AGENTS, FRAMEWORKS, hasFrontend, listEnglish, ORMS, type StartConfig } from '../lib/config'
import { primLabels, selectedFeatures, type StartFeature } from '../lib/features'

interface StartHeroProps {
  cfg: StartConfig
  features: StartFeature[]
  agentCopied: boolean
  onCopyPlan: () => void
  onViewPlan: () => void
}

export function StartHero({ cfg, features, agentCopied, onCopyPlan, onViewPlan }: StartHeroProps) {
  const fw = FRAMEWORKS[cfg.framework]
  const frontend = hasFrontend(cfg)
  const prims = primLabels(cfg, features)
  const agentLabel = AGENTS[cfg.agent].label
  const toolLine = `the ${agentLabel} plugin and the CLI`
  const featLabels = selectedFeatures(cfg, features).map((f) => f.name)

  // What the prompt does — varies with project kind and whether there's a front-end.
  const buildClause = frontend
    ? cfg.project === 'new'
      ? `The prompt scaffolds a fresh ${fw.label} app, installs ${toolLine}, ${cfg.shadcn ? 'drops in shadcn/ui blocks' : 'wires up your client'}`
      : `The prompt installs ${toolLine}, adds Supabase to your ${fw.label} app, ${cfg.shadcn ? 'drops in shadcn/ui blocks' : 'wires up your client'}`
    : `The prompt installs ${toolLine}, sets up your Supabase backend`

  return (
    <div>
      <h1 className="m-0 text-[33px] font-semibold leading-tight tracking-tight">
        {frontend ? `Add Supabase to your ${fw.label} app` : 'Set up your Supabase backend'}
      </h1>

      <p className="mb-8 mt-3 max-w-xl text-base text-foreground-light">
        A code-first setup for{' '}
        <span className="font-medium text-foreground">
          {prims.length ? listEnglish(prims) : 'the services you pick'}
        </span>
        , running {cfg.connection === 'remote' ? 'on a hosted project' : 'locally in Docker'}.{' '}
        {buildClause}
        {cfg.orm !== 'none' ? ` with ${ORMS[cfg.orm].label}` : ''}, and scaffolds{' '}
        {prims.length ? listEnglish(prims) : 'your chosen services'}
        {featLabels.length ? `, plus ${listEnglish(featLabels)}` : ''} — code-first. Nothing runs
        until you do.{' '}
        <button
          type="button"
          onClick={onViewPlan}
          className="border-b border-brand/30 text-brand-600 transition-colors hover:border-brand"
        >
          View plan →
        </button>
      </p>

      <div className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center gap-3.5">
          <Button type="primary" size="medium" icon={<Bot size={16} />} onClick={onCopyPlan}>
            Copy agent plan
          </Button>
          <span className="text-[13.5px] text-foreground-muted">or follow the guide below ↓</span>
        </div>
        <div
          className={cn(
            'flex items-center gap-2 overflow-hidden text-[13.5px] text-brand-600 transition-opacity',
            agentCopied ? 'h-auto opacity-100' : 'h-0 opacity-0'
          )}
        >
          <Check size={15} />
          Copied to clipboard — paste the plan into your agent.
        </div>
      </div>
    </div>
  )
}
