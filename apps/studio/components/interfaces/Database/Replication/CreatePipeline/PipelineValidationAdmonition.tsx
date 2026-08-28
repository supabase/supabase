import { forwardRef } from 'react'
import { Admonition } from 'ui-patterns/Admonition'

import { Markdown } from '@/components/interfaces/Markdown'
import type { ValidationFailure } from '@/data/replication/validate-destination-mutation'

export const SANDWICHED_ADMONITION_CLASS =
  'mb-0 rounded-none border-x-0 border-t-0 border-b border-default'

export const CONNECTION_VALIDATION_HINT =
  'Check destination credentials and connection settings, including Advanced settings on this step.'

export const DATA_VALIDATION_HINT =
  'Some issues may require changes to the project’s database settings.'

const GENERIC_WARNING_TITLES = new Set(['warning', 'warnings'])

const getValidationHeading = ({
  failures,
  hasCritical,
  title,
}: {
  failures: ValidationFailure[]
  hasCritical: boolean
  title?: string
}) => {
  if (title) return title

  if (hasCritical) {
    return failures.length === 1 ? failures[0].name : 'Configuration issues'
  }

  if (failures.length === 1) {
    const { name } = failures[0]
    return GENERIC_WARNING_TITLES.has(name.trim().toLowerCase()) ? 'Review before continuing' : name
  }

  return `${failures.length} warnings to review`
}

export const PipelineValidationAdmonition = forwardRef<
  React.ComponentRef<typeof Admonition>,
  {
    failures: ValidationFailure[]
    title?: string
    hint?: string
  }
>(function PipelineValidationAdmonition({ failures, title, hint }, ref) {
  if (failures.length === 0) return null

  const hasCritical = failures.some((failure) => failure.failure_type === 'critical')
  const heading = getValidationHeading({ failures, hasCritical, title })

  return (
    <Admonition
      ref={ref}
      type={hasCritical ? 'danger' : 'warning'}
      title={heading}
      layout="responsive"
      className={SANDWICHED_ADMONITION_CLASS}
    >
      {!hasCritical ? (
        <p className="mb-2! text-sm text-foreground-light">
          Replication can start, but review these items before continuing. They may affect how
          changes are applied downstream.
        </p>
      ) : null}
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
      {hint ? <p className="mt-2 mb-0! text-sm text-foreground-light">{hint}</p> : null}
    </Admonition>
  )
})
