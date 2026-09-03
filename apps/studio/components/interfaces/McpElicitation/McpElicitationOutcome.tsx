import { Admonition } from 'ui-patterns/Admonition'

import type { ElicitationOutcomeState } from './McpElicitation.types'
import { getElicitationCopy } from './McpElicitation.utils'
import { McpElicitationFooter, McpElicitationShell } from './McpElicitationShell'

/**
 * Terminal states. Each carries its own recovery path in the callout and footer,
 * including the ones that read as failures — none of them dead-ends.
 */
export const McpElicitationOutcome = ({ state }: { state: ElicitationOutcomeState }) => {
  const { title, subtitle, calloutTitle, calloutBody, footer } = getElicitationCopy(state)

  return (
    <McpElicitationShell title={title} subtitle={subtitle}>
      <Admonition type="note" title={calloutTitle} description={calloutBody} className="mb-0" />
      <McpElicitationFooter>{footer}</McpElicitationFooter>
    </McpElicitationShell>
  )
}
