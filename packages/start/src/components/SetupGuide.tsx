'use client'

import { Info } from 'lucide-react'
import { cn } from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'

import { toCodeBlockLang } from '../lib/features'
import { type SetupStep, type StepBlock } from '../lib/steps'
import { FileTree } from './FileTree'

function Block({ block }: { block: StepBlock }) {
  if (block.type === 'note') {
    return (
      <div className="mb-3 flex items-start gap-2.5 rounded-lg bg-surface-100 px-3.5 py-3 text-[13.5px] text-foreground-light">
        <Info size={15} className="mt-0.5 flex-none text-brand" />
        <span>{block.text}</span>
      </div>
    )
  }
  if (block.type === 'filetree') {
    return <FileTree tree={block.tree} />
  }
  return (
    <div className="mb-3">
      <CodeBlock
        title={block.lang}
        language={toCodeBlockLang(block.lang) as never}
        value={block.code}
        hideLineNumbers
        focusable={false}
        className="block"
      />
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
    <section>
      <div className="mb-1.5 flex items-center justify-between">
        <h2 className="m-0 text-xl font-semibold tracking-tight">Setup guide</h2>
        <span className="text-[13px] text-foreground-muted">
          {steps.length} steps · {frameworkLabel}
        </span>
      </div>
      <p className="mb-7 text-sm text-foreground-light">
        Each step reflects exactly what you picked. Swap any toggle on the left and these update
        live.
      </p>

      <div className="relative">
        {steps.map((step, i) => (
          <div key={step.id} className="relative pb-7 pl-11">
            {/* connector line */}
            {i < steps.length - 1 && (
              <span className="absolute bottom-0 left-[13px] top-7 w-px bg-border-default" />
            )}
            <span
              className={cn(
                'absolute left-0 top-0 grid h-7 w-7 place-items-center rounded-full text-[13px] font-semibold tabular-nums',
                step.key
                  ? 'bg-brand-200 text-brand-600 ring-1 ring-inset ring-brand/30'
                  : 'bg-surface-200 text-foreground-light'
              )}
            >
              {i + 1}
            </span>
            <h3 className="mb-1.5 mt-0.5 text-[15.5px] font-semibold tracking-tight">
              {step.title}
              {step.feature && (
                <span className="ml-2 rounded-full bg-brand-200 px-2 py-px align-middle text-[10.5px] font-medium text-brand-600">
                  feature
                </span>
              )}
            </h3>
            {step.desc && <p className="mb-3 text-sm text-foreground-light">{step.desc}</p>}
            {step.blocks.map((block, j) => (
              <Block key={j} block={block} />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
