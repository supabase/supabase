import { useId, useState } from 'react'
import { Button } from 'ui'

import { getScopeCommands, type ParsedScope, type ScopeAction } from './CliAuth.utils'

const GROUP_LABEL: Record<ScopeAction, string> = {
  write: 'READ-WRITE',
  read: 'READ',
}

const ScopeGroup = ({ action, scopes }: { action: ScopeAction; scopes: ParsedScope[] }) => (
  <div className="flex flex-col gap-2 py-3">
    <p className="font-mono text-xs uppercase tracking-wider text-foreground-light">
      {GROUP_LABEL[action]}
    </p>
    <p className="text-sm text-foreground">{scopes.map((scope) => scope.label).join(', ')}</p>
  </div>
)

const ScopeCommandsRow = ({ scope }: { scope: ParsedScope }) => {
  const commands = getScopeCommands(scope)

  return (
    <div className="flex flex-col gap-2 py-3">
      <p className="text-sm text-foreground">{scope.label}</p>
      {commands.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {commands.map((command) => (
            <code
              key={command}
              className="rounded bg-surface-200 px-1.5 py-0.5 font-mono text-xs text-foreground-light"
            >
              {command}
            </code>
          ))}
        </div>
      )}
    </div>
  )
}

export const CliAuthPermissions = ({
  appName,
  scopes,
}: {
  appName: string
  scopes: ParsedScope[]
}) => {
  const [showCommands, setShowCommands] = useState(false)
  const permissionsRegionId = useId()

  if (scopes.length === 0) {
    return <p className="text-xs text-foreground-lighter">No permissions requested.</p>
  }

  const writeScopes = scopes.filter((scope) => scope.action === 'write')
  const readScopes = scopes.filter((scope) => scope.action === 'read')

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-foreground">Permissions requested</p>
        <Button
          type="button"
          size="tiny"
          variant="text"
          className="shrink-0 px-1 text-foreground-lighter hover:text-foreground"
          aria-expanded={showCommands}
          aria-controls={permissionsRegionId}
          onClick={() => setShowCommands(!showCommands)}
        >
          {showCommands ? 'Hide commands' : 'Show commands'}
        </Button>
      </div>

      <div id={permissionsRegionId} className="divide-y rounded-md border px-4">
        {showCommands &&
          [...writeScopes, ...readScopes].map((scope) => (
            <ScopeCommandsRow key={scope.key} scope={scope} />
          ))}
        {!showCommands && writeScopes.length > 0 && (
          <ScopeGroup action="write" scopes={writeScopes} />
        )}
        {!showCommands && readScopes.length > 0 && <ScopeGroup action="read" scopes={readScopes} />}
      </div>

      <p className="text-xs text-foreground-lighter">
        Authorizing {appName} grants it the following access to the selected project.
      </p>
    </section>
  )
}
