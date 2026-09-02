import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import {
  useOAuthGrants,
  type OAuthGrant,
} from '@/registry/default/blocks/headless-app-tanstack/hooks/use-oauth-grants'
import { Button } from '@/registry/default/components/ui/button'

const buildPrompt = (productName: string, mcpServerUrl: string) =>
  `Connect to ${productName} using this MCP server:\n\n${mcpServerUrl}\n\nThen list the tools it gives you.`

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

function ConnectPrompt({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-muted">
      <pre className="overflow-x-auto whitespace-pre-wrap p-4 font-mono text-sm leading-relaxed">
        {prompt}
      </pre>
      <div className="flex justify-end border-t p-2">
        <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? 'Copied' : 'Copy prompt'}
        </Button>
      </div>
    </div>
  )
}

function GrantRow({
  grant,
  isRevoking,
  onRevoke,
}: {
  grant: OAuthGrant
  isRevoking: boolean
  onRevoke: () => void
}) {
  return (
    <li className="flex items-center gap-4 p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate font-medium">{grant.client.name}</span>
        <span className="truncate text-muted-foreground">
          Connected {formatDate(grant.granted_at)}
          {grant.scopes.length > 0 && ` · ${grant.scopes.join(', ')}`}
        </span>
      </div>
      <Button type="button" size="sm" variant="outline" disabled={isRevoking} onClick={onRevoke}>
        {isRevoking ? 'Revoking access...' : 'Revoke access'}
      </Button>
    </li>
  )
}

export interface ConnectedAgentsViewProps extends React.ComponentPropsWithoutRef<'div'> {
  mcpServerUrl: string
  productName?: string
  grants?: OAuthGrant[] | null
  isLoading?: boolean
  error?: string | null
  revokingClientId?: string | null
  onRevoke?: (clientId: string) => void
}

// The presentational half, so a preview can render either state with fixed data.
export function ConnectedAgentsView({
  mcpServerUrl,
  productName = 'this app',
  grants = null,
  isLoading = false,
  error = null,
  revokingClientId = null,
  onRevoke,
  className,
  ...props
}: ConnectedAgentsViewProps) {
  const hasGrants = grants !== null && grants.length > 0

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      {/* Typography matches CardTitle and CardDescription, without a card around it. */}
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-2xl font-semibold leading-none tracking-tight">Connected agents</h1>
        <p className="text-sm text-muted-foreground">
          {hasGrants
            ? `Agents you authorized to use ${productName} on your behalf.`
            : 'No agents yet. Paste this prompt into an agent to connect it.'}
        </p>
      </div>

      {isLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading connected agents...
        </p>
      )}

      {grants &&
        (hasGrants ? (
          <ul className="divide-y rounded-lg border bg-muted text-sm">
            {grants.map((grant) => (
              <GrantRow
                key={grant.client.id}
                grant={grant}
                isRevoking={revokingClientId === grant.client.id}
                onRevoke={() => onRevoke?.(grant.client.id)}
              />
            ))}
          </ul>
        ) : (
          <ConnectPrompt prompt={buildPrompt(productName, mcpServerUrl)} />
        ))}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

interface ConnectedAgentsProps extends React.ComponentPropsWithoutRef<'div'> {
  mcpServerUrl: string
  productName?: string
}

export function ConnectedAgents(props: ConnectedAgentsProps) {
  const { grants, error, isLoading, revokingClientId, revoke } = useOAuthGrants()

  return (
    <ConnectedAgentsView
      grants={grants}
      error={error}
      isLoading={isLoading}
      revokingClientId={revokingClientId}
      onRevoke={(clientId) => void revoke(clientId)}
      {...props}
    />
  )
}
