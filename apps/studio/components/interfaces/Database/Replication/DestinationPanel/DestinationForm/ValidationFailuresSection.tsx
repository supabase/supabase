import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge, Card } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { Markdown } from '@/components/interfaces/Markdown'
import type { ValidationFailure } from '@/data/replication/validate-destination-mutation'

interface ValidationFailuresSectionProps {
  destinationFailures: ValidationFailure[]
  pipelineFailures: ValidationFailure[]
}

export const ValidationFailuresSection = ({
  destinationFailures,
  pipelineFailures,
}: ValidationFailuresSectionProps) => {
  const validationIssues = [...destinationFailures, ...pipelineFailures].sort((a, _b) =>
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
      <p className="text-sm text-foreground-light mb-2!">
        {hasCriticalFailures
          ? `Please fix all required issues below${hasWarnings ? ' and review the others' : ''} before continuing.`
          : 'The following issues were identified, although you may still create the pipeline and start replication to the destination.'}
      </p>
      <Card>
        <Accordion type="multiple">
          {validationIssues.map((failure, idx) => (
            <AccordionItem key={idx} value={`${failure.name}+${idx}`} className="last:border-b-0">
              <AccordionTrigger className="cursor-pointer text-sm px-3 text-foreground decoration-foreground-lighter [&>p]:mb-0!">
                <p className="flex items-center gap-x-2">
                  {failure.name}
                  {failure.failure_type === 'critical' ? (
                    <Badge variant="warning">Required</Badge>
                  ) : (
                    <Badge variant="default">Warning</Badge>
                  )}
                </p>
              </AccordionTrigger>
              <AccordionContent className="px-3">
                <Markdown className="text-sm text-foreground-light [&>p]:mb-2!">
                  {failure.reason}
                </Markdown>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>
    </Admonition>
  )
}
