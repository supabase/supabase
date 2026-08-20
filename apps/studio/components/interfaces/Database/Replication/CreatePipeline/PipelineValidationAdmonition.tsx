import { forwardRef } from 'react'
import { Admonition } from 'ui-patterns/Admonition'

import { Markdown } from '@/components/interfaces/Markdown'
import type { ValidationFailure } from '@/data/replication/validate-destination-mutation'

export const SANDWICHED_ADMONITION_CLASS =
  'mb-0 rounded-none border-x-0 border-t-0 border-b border-default'

export const PipelineValidationAdmonition = forwardRef<
  React.ComponentRef<typeof Admonition>,
  {
    failures: ValidationFailure[]
    title?: string
    hint?: React.ReactNode
  }
>(function PipelineValidationAdmonition({ failures, title, hint }, ref) {
  if (failures.length === 0) return null

  const hasCritical = failures.some((failure) => failure.failure_type === 'critical')
  const heading = title ?? (failures.length === 1 ? failures[0].name : 'Configuration issues')

  return (
    <Admonition
      ref={ref}
      type={hasCritical ? 'warning' : 'note'}
      title={heading}
      layout="responsive"
      className={SANDWICHED_ADMONITION_CLASS}
    >
      <ul className="space-y-2">
        {failures.map((failure, index) => (
          <li key={`${failure.name}-${index}`}>
            {failures.length > 1 ? (
              <p className="mb-0.5! font-medium text-foreground">{failure.name}</p>
            ) : null}
            <Markdown className="text-sm text-foreground-light [&>p]:mb-0!">
              {failure.reason}
            </Markdown>
          </li>
        ))}
      </ul>
      {hint}
    </Admonition>
  )
})
