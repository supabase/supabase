import type { ValidationFailure } from 'data/replication/validate-destination-mutation'
import {
  Accordion_Shadcn_,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  Badge,
  Card,
} from 'ui'
import { Admonition } from 'ui-patterns'

interface ValidationFailuresSectionProps {
  destinationFailures: ValidationFailure[]
  pipelineFailures: ValidationFailure[]
}

export const ValidationFailuresSection = ({
  destinationFailures,
  pipelineFailures,
}: ValidationFailuresSectionProps) => {
  const validationIssues = [...destinationFailures, ...pipelineFailures].sort((a, b) =>
    a.failure_type === 'critical' ? -1 : 1
  )

  const criticalFailures = validationIssues.filter((f) => f.failure_type === 'critical')
  const warnings = validationIssues.filter((f) => f.failure_type === 'warning')

  const hasCriticalFailures = criticalFailures.length > 0
  const hasWarnings = warnings.length > 0

  if (validationIssues.length === 0) {
    return null
  }

  return (
    <Admonition
      type={hasCriticalFailures ? 'warning' : 'default'}
      className="px-5 rounded-none border-0"
      title="Destination configuration issues"
    >
      <p className="text-sm text-foreground-light !mb-2">
        {hasCriticalFailures
          ? `Please fix all required issues below${hasWarnings ? ' and review the others' : ''} before continuing.`
          : 'The following issues were identified, although you may still proceed to create the destination.'}
      </p>
      <Card>
        <Accordion_Shadcn_ type="multiple">
          {validationIssues.map((failure, idx) => (
            <AccordionItem_Shadcn_
              key={idx}
              value={`${failure.name}+${idx}`}
              className="last:border-b-0"
            >
              <AccordionTrigger_Shadcn_ className="text-sm px-3 text-foreground decoration-foreground-lighter">
                <p className="flex items-center gap-x-2">
                  {failure.name}
                  {failure.failure_type === 'critical' && <Badge variant="warning">Required</Badge>}
                </p>
              </AccordionTrigger_Shadcn_>
              <AccordionContent_Shadcn_ className="px-3">
                <p className="whitespace-pre-wrap text-sm">
                  {failure.reason.replaceAll('\n\n', '\n')}
                </p>
              </AccordionContent_Shadcn_>
            </AccordionItem_Shadcn_>
          ))}
        </Accordion_Shadcn_>
      </Card>
    </Admonition>
  )
}
