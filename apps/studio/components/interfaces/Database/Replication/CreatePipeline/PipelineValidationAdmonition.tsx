import { forwardRef, type ComponentRef, type PropsWithChildren } from 'react'
import { Admonition } from 'ui-patterns/Admonition'

import { Markdown } from '@/components/interfaces/Markdown'
import type { ValidationFailure } from '@/data/replication/validate-destination-mutation'

export const SANDWICHED_ADMONITION_CLASS =
  'mb-0 rounded-none border-x-0 border-t border-b-0 border-default'

export const CONNECTION_VALIDATION_HINT =
  'Check the destination credentials and connection settings, including Advanced settings.'

export const DATA_VALIDATION_HINT =
  'Some issues may require changes to the project’s database settings.'

const GENERIC_WARNING_TITLES = new Set(['warning', 'warnings'])

const formatHeading = (name: string) =>
  name === 'BigQuery Dataset Not Found' ? 'BigQuery dataset not found' : name

const InlineParagraph = ({ children }: PropsWithChildren) => <span>{children} </span>

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
    return failures.length === 1 ? formatHeading(failures[0].name) : 'Configuration issues'
  }

  if (failures.length === 1) {
    const { name } = failures[0]
    return GENERIC_WARNING_TITLES.has(name.trim().toLowerCase())
      ? 'Review before continuing'
      : formatHeading(name)
  }

  return `${failures.length} warnings to review`
}

export const PipelineValidationAdmonition = forwardRef<
  ComponentRef<typeof Admonition>,
  {
    failures: ValidationFailure[]
    title?: string
    hint?: string
    stale?: boolean
  }
>(function PipelineValidationAdmonition({ failures, title, hint, stale = false }, ref) {
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
      {!hasCritical && !stale ? (
        <p className="mb-2! text-sm text-foreground-light">
          Replication can start, but review these items before continuing. They may affect how
          changes are applied downstream.
        </p>
      ) : null}
      <div className="space-y-2">
        {failures.map((failure, index) => (
          <div key={`${failure.name}-${index}`}>
            {failures.length > 1 ? (
              <p className="mb-0.5! font-medium text-foreground">
                {formatHeading(failure.name)}
                {hasCritical && failures.some((item) => item.failure_type === 'warning')
                  ? ` (${failure.failure_type === 'critical' ? 'required' : 'warning'})`
                  : ''}
              </p>
            ) : null}
            <Markdown className="text-sm text-foreground-light" components={{ p: InlineParagraph }}>
              {failure.reason}
            </Markdown>
          </div>
        ))}
      </div>
      {stale ? (
        <p className="mt-2 mb-0! text-sm text-foreground-light">
          Settings changed. Test the connection again.
        </p>
      ) : null}
      {hint ? <p className="mt-2 mb-0! text-sm text-foreground-light">{hint}</p> : null}
    </Admonition>
  )
})
