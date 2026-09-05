import { Admonition } from 'ui-patterns/Admonition'

import type { ElicitationOutcomeState } from './McpElicitation.types'
import { getElicitationCopy } from './McpElicitation.utils'
import { McpElicitationFooter, McpElicitationShell } from './McpElicitationShell'

export const McpElicitationOutcome = ({ state }: { state: ElicitationOutcomeState }) => {
  const { title, subtitle, calloutTitle, calloutBody, footer } = getElicitationCopy(state)

  return (
    <McpElicitationShell title={title} subtitle={subtitle}>
      <Admonition type="note" title={calloutTitle} description={calloutBody} className="mb-0" />
      <McpElicitationFooter>{footer}</McpElicitationFooter>
    </McpElicitationShell>
  )
}
