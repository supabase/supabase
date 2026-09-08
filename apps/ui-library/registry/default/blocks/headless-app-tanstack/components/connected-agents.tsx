import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'
import {
  useOAuthGrants,
  type OAuthGrant,
} from '@/registry/default/blocks/headless-app-tanstack/hooks/use-oauth-grants'
import { Button } from '@/registry/default/components/ui/button'

const buildPrompt = (productName: string, mcpServerUrl: string) =>
  `Connect to ${productName} using this MCP server:\n\n${mcpServerUrl}\n\nUse your MCP connection setup to authorize access in my browser. Then call whoami to verify the connection and list the available tools.`

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

function ConnectAgent({
  productName,
  mcpServerUrl,
}: {
  productName: string
  mcpServerUrl: string
}) {
  const [copied, setCopied] = useState<'url' | 'prompt' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(null), 2000)
    return () => window.clearTimeout(timeout)
  }, [copied])

  const copy = async (type: 'url' | 'prompt') => {
    setError(null)
    try {
      await navigator.clipboard.writeText(
        type === 'url' ? mcpServerUrl : buildPrompt(productName, mcpServerUrl)
      )
      setCopied(type)
    } catch {
      setCopied(null)
      setError('Unable to copy. Select and copy the server URL above.')
    }
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Connect an agent">
      <h2 className="font-medium">Connect an agent</h2>
      <p className="text-sm text-muted-foreground">
        Add this server URL in your agent’s MCP settings, then sign in and approve access.
      </p>
      <div className="overflow-hidden rounded-lg border bg-muted">
        <pre className="overflow-x-auto whitespace-pre-wrap break-all p-4 font-mono text-sm">
          {mcpServerUrl}
        </pre>
        <div className="flex flex-wrap justify-end gap-2 border-t p-2">
          <Button type="button" size="sm" variant="outline" onClick={() => void copy('prompt')}>
            {copied === 'prompt' ? 'Prompt copied' : 'Copy prompt'}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => void copy('url')}>
            {copied === 'url' ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied === 'url' ? 'URL copied' : 'Copy URL'}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Use the prompt if your agent supports adding MCP servers through chat.
      </p>
      {copied && (
        <span role="status" className="sr-only">
          Copied to clipboard
        </span>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}

function GrantRow({
  grant,
  isRevoking,
  disabled,
  onRevoke,
}: {
  grant: OAuthGrant
  isRevoking: boolean
  disabled: boolean
  onRevoke: () => void
}) {
  return (
    <li className="flex items-center gap-4 p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate font-medium">{grant.client.name}</span>
        <span className="truncate text-muted-foreground">
          Authorized {formatDate(grant.granted_at)}
          {grant.scopes.length > 0 && ` · ${grant.scopes.join(', ')}`}
        </span>
      </div>
      <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={onRevoke}>
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
  onRefresh?: () => void
  onRevoke?: (clientId: string) => void
}

export function ConnectedAgentsView({
  mcpServerUrl,
  productName = 'this app',
  grants = null,
  isLoading = false,
  error = null,
  revokingClientId = null,
  onRefresh,
  onRevoke,
  className,
  ...props
}: ConnectedAgentsViewProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-2xl font-semibold leading-none tracking-tight">Connected agents</h1>
        <p className="text-sm text-muted-foreground">
          Authorize agents to use {productName} on your behalf.
        </p>
      </div>

      <ConnectAgent productName={productName} mcpServerUrl={mcpServerUrl} />

      <section className="flex flex-col gap-3" aria-label="Authorized agents">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-medium">Authorized agents</h2>
          {onRefresh && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isLoading || revokingClientId !== null}
              onClick={onRefresh}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
        </div>
        {isLoading && (
          <p role="status" className="text-sm text-muted-foreground">
            Loading connected agents...
          </p>
        )}
        {grants && grants.length > 0 && (
          <ul className="divide-y rounded-lg border bg-muted text-sm">
            {grants.map((grant) => (
              <GrantRow
                key={grant.client.id}
                grant={grant}
                isRevoking={revokingClientId === grant.client.id}
                disabled={isLoading || revokingClientId !== null || !onRevoke}
                onRevoke={() => onRevoke?.(grant.client.id)}
              />
            ))}
          </ul>
        )}
        {!isLoading && !error && grants?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No agents authorized yet. Connect an agent using the server URL above.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {grants && grants.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Revoking access prevents an agent from renewing its session. Its current access token
            may work until it expires.
          </p>
        )}
      </section>
    </div>
  )
}

interface ConnectedAgentsProps extends React.ComponentPropsWithoutRef<'div'> {
  mcpServerUrl: string
  productName?: string
}

export function ConnectedAgents(props: ConnectedAgentsProps) {
  const { grants, error, isLoading, revokingClientId, refresh, revoke } = useOAuthGrants()

  return (
    <ConnectedAgentsView
      grants={grants}
      error={error}
      isLoading={isLoading}
      revokingClientId={revokingClientId}
      onRefresh={() => void refresh()}
      onRevoke={(clientId) => void revoke(clientId)}
      {...props}
    />
  )
}
