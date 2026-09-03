import type { ElicitationRequest } from './McpElicitation.types'

export const MOCK_ELICITATION_REQUEST_KEYS = ['openai', 'resend', 'unknown'] as const

export type MockElicitationRequestKey = (typeof MOCK_ELICITATION_REQUEST_KEYS)[number]

/**
 * Stand-ins until the handoff API lands. Nothing here may leak into the
 * component layer — `useElicitationRequest` is the only consumer.
 */
export const MOCK_ELICITATION_REQUESTS = {
  openai: {
    tool: 'store_secret',
    client: 'Claude Code 2.1.4',
    requestedAt: '1:36 PM',
    project: 'acme-prod',
    account: 'hello@kemal.lol',
    keyName: 'openai-key',
    providerHint: {
      name: 'OpenAI',
      prefix: 'sk-',
      dashboardUrl: 'https://platform.openai.com/api-keys',
    },
  },
  resend: {
    tool: 'store_secret',
    client: 'Cursor 1.7.2',
    requestedAt: '9:02 AM',
    project: 'billing-staging',
    account: 'ops@example.com',
    keyName: 'resend-key',
    providerHint: {
      name: 'Resend',
      prefix: 're_',
      dashboardUrl: 'https://resend.com/api-keys',
    },
  },
  // No provider hint, unknown client, and a name long enough to overflow the
  // field — the page must read correctly without any of them.
  unknown: {
    tool: 'store_secret',
    client: null,
    requestedAt: '11:47 PM',
    project: 'internal-tools',
    account: 'platform-team@example.com',
    keyName: 'legacy-internal-billing-service-token-production',
  },
} as const satisfies Record<MockElicitationRequestKey, ElicitationRequest>

export const DEFAULT_MOCK_ELICITATION_REQUEST_KEY: MockElicitationRequestKey = 'openai'

export const MOCK_SIGNED_IN_ACCOUNT = 'hello@kemal.lol'
