import { Rocket } from 'lucide-react'
import { Button } from 'ui'

import type { ExampleDeploy } from '@/data/types'

/** Renders `code` spans inside a step, so steps can stay plain strings in metadata. */
function StepText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, index) =>
        part.startsWith('`') ? (
          <code
            key={index}
            className="rounded bg-surface-300 px-1.5 py-0.5 font-mono text-sm text-foreground"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  )
}

export function DeployInstructions({ deploy }: { deploy: ExampleDeploy }) {
  return (
    <section aria-labelledby="deploy-heading" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="deploy-heading" className="text-2xl font-medium">
          Deploy it yourself
        </h2>
        {deploy.deployUrl && (
          <Button asChild variant="primary" icon={<Rocket />}>
            <a href={deploy.deployUrl} target="_blank" rel="noreferrer">
              Deploy to Vercel
            </a>
          </Button>
        )}
      </div>

      <ol className="flex flex-col gap-4">
        {deploy.steps.map((step, index) => (
          <li key={step} className="flex gap-4">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-surface-100 text-sm text-foreground-light">
              {index + 1}
            </span>
            <p className="pt-0.5 text-foreground-light">
              <StepText text={step} />
            </p>
          </li>
        ))}
      </ol>

      {deploy.env.length > 0 && (
        <div className="overflow-hidden rounded-lg border">
          <div className="border-b bg-surface-100 px-4 py-2.5 text-sm font-medium">
            Environment variables
          </div>
          <dl className="divide-y">
            {deploy.env.map((variable) => (
              <div key={variable.name} className="grid gap-1 px-4 py-3 sm:grid-cols-[16rem_1fr]">
                <dt className="font-mono text-xs">{variable.name}</dt>
                <dd className="text-sm text-foreground-light">{variable.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  )
}
