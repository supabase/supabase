import { Admonition } from 'ui-patterns/Admonition'

import type { SecretsOutcomeState } from './McpSecrets.types'
import { getSecretsCopy } from './McpSecrets.utils'
import { McpSecretsFooter, McpSecretsShell } from './McpSecretsShell'

export const McpSecretsOutcome = ({ state }: { state: SecretsOutcomeState }) => {
  const { title, subtitle, calloutTitle, calloutBody, footer } = getSecretsCopy(state)

  return (
    <McpSecretsShell title={title} subtitle={subtitle}>
      <Admonition type="note" title={calloutTitle} description={calloutBody} className="mb-0" />
      <McpSecretsFooter>{footer}</McpSecretsFooter>
    </McpSecretsShell>
  )
}
