'use client'

import { Admonition } from 'ui-patterns/admonition'

import { type SetupStep, type StepBlock } from '../lib/steps'
import { FileTree } from './FileTree'
import { GuideCodeBlock } from './guide/GuideCodeBlock'

function Block({ block }: { block: StepBlock }) {
  if (block.type === 'note') {
    return <Admonition type="note" description={block.text} />
  }
  if (block.type === 'filetree') {
    return (
      <div className="not-prose">
        <FileTree tree={block.tree} />
      </div>
    )
  }
  return <GuideCodeBlock lang={block.lang} code={block.code} />
}

function SetupGuideStep({
  step,
  stepNumber,
  isLast,
}: {
  step: SetupStep
  stepNumber: number
  isLast: boolean
}) {
  return (
    <div className="group relative pb-8">
      <div className="absolute left-[11px] h-full w-px pt-1">
        <div
          className={`absolute h-full w-full py-1 bg-border-control ${isLast ? 'bg-transparent' : ''}`}
        />
      </div>

      <div className="absolute left-0 flex items-center gap-3 not-prose">
        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-control bg-surface-100 font-mono text-xs font-normal text-foreground dropshadow-sm">
          {stepNumber}
        </div>
      </div>

      <div className="ml-12">
        <div className="prose prose-docs max-w-none text-base text-foreground-light">
          <h3 className="mt-0 text-base text-foreground">{step.title}</h3>
          {step.desc ? <p>{step.desc}</p> : null}
        </div>
        {step.blocks.length > 0 ? (
          <div className="mt-6 space-y-6">
            {step.blocks.map((block, index) => (
              <Block key={index} block={block} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function SetupGuide({
  steps,
  frameworkLabel,
}: {
  steps: SetupStep[]
  frameworkLabel: string
}) {
  return (
    <section className="prose prose-docs max-w-none">
      <h1 className="mb-0">Setup guide</h1>
      <h2 className="mt-3 text-xl text-foreground-light">
        Each step reflects exactly what you picked. Swap any toggle on the left and these update
        live.
      </h2>
      <p className="not-prose mb-0 mt-3 text-sm text-foreground-lighter">
        {steps.length} steps · {frameworkLabel}
      </p>
      <hr className="not-prose my-8 border-b border-t-0" />

      <div className="not-prose">
        {steps.map((step, index) => (
          <SetupGuideStep
            key={step.id}
            step={step}
            stepNumber={index + 1}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>
    </section>
  )
}
