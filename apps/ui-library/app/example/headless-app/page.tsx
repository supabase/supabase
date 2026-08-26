'use client'

import { useState } from 'react'

import { ConnectedAgentsView } from '@/registry/default/blocks/headless-app-tanstack/components/connected-agents'
import type { OAuthGrant } from '@/registry/default/blocks/headless-app-tanstack/hooks/use-oauth-grants'
import { OAuthConsentCard } from '@/registry/default/blocks/oauth-consent/components/oauth-consent'
import { LoginForm } from '@/registry/default/blocks/password-based-auth-nextjs/components/login-form'

const PRODUCT_NAME = 'Acme'
const MCP_SERVER_URL = 'https://your-project.supabase.co/functions/v1/mcp-server'

const grants: OAuthGrant[] = [
  {
    client: { id: 'claude-code', name: 'Claude Code', uri: '', logo_uri: '' },
    scopes: ['openid', 'profile'],
    granted_at: '2026-08-20T09:12:00Z',
  },
  {
    client: { id: 'codex', name: 'Codex', uri: '', logo_uri: '' },
    scopes: ['openid'],
    granted_at: '2026-08-24T16:40:00Z',
  },
]

const screens = {
  'sign-in': <LoginForm className="mx-auto max-w-sm" />,
  consent: (
    <OAuthConsentCard
      className="mx-auto max-w-lg"
      clientName="Claude Code"
      productName={PRODUCT_NAME}
      redirectUri="http://localhost:3000/callback"
      email="alex@example.com"
      scopes={['openid', 'profile']}
    />
  ),
  connect: (
    <ConnectedAgentsView mcpServerUrl={MCP_SERVER_URL} productName={PRODUCT_NAME} grants={[]} />
  ),
  connected: (
    <ConnectedAgentsView mcpServerUrl={MCP_SERVER_URL} productName={PRODUCT_NAME} grants={grants} />
  ),
}

const labels: Record<keyof typeof screens, string> = {
  'sign-in': 'Sign in',
  consent: 'Consent',
  connect: 'Connect',
  connected: 'Connected',
}

export default function HeadlessAppDemo() {
  const [screen, setScreen] = useState<keyof typeof screens>('sign-in')

  return (
    <div className="flex flex-col gap-8">
      <div className="mx-auto flex rounded-lg bg-secondary p-1" role="group" aria-label="Screen">
        {(Object.keys(screens) as (keyof typeof screens)[]).map((key) => (
          <button
            key={key}
            type="button"
            tabIndex={0}
            aria-pressed={screen === key}
            data-active={screen === key}
            className="rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors data-[active=true]:bg-background data-[active=true]:text-foreground"
            onClick={() => setScreen(key)}
          >
            {labels[key]}
          </button>
        ))}
      </div>
      {screens[screen]}
    </div>
  )
}
