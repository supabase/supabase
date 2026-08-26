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
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        No agents yet. Paste this prompt into an agent to connect it.
      </p>
      <div className="overflow-hidden rounded-lg border bg-card">
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
    <li className="flex items-center gap-4 border-b p-4 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate font-medium">{grant.client.name}</span>
        <span className="truncate text-xs text-muted-foreground">
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

interface ConnectedAgentsProps extends React.ComponentPropsWithoutRef<'section'> {
  mcpServerUrl: string
  productName?: string
}

export function ConnectedAgents({
  mcpServerUrl,
  productName = 'this app',
  className,
  ...props
}: ConnectedAgentsProps) {
  const { grants, error, isLoading, revokingClientId, revoke } = useOAuthGrants()

  return (
    <section className={cn('flex flex-col gap-6', className)} {...props}>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl tracking-tight">Connected agents</h1>
        <p className="text-sm text-muted-foreground">
          Agents you authorized to use {productName} on your behalf.
        </p>
      </div>

      {isLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading connected agents...
        </p>
      )}

      {grants &&
        (grants.length > 0 ? (
          <ul className="rounded-lg border">
            {grants.map((grant) => (
              <GrantRow
                key={grant.client.id}
                grant={grant}
                isRevoking={revokingClientId === grant.client.id}
                onRevoke={() => void revoke(grant.client.id)}
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
    </section>
  )
}
