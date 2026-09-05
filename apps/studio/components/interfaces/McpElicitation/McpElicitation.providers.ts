import type { ElicitationProviderHint } from './McpElicitation.types'

const PROVIDER_HINTS: ReadonlyArray<{ match: string; hint: ElicitationProviderHint }> = [
  {
    match: 'openai',
    hint: {
      name: 'OpenAI',
      prefix: 'sk-',
      dashboardUrl: 'https://platform.openai.com/api-keys',
    },
  },
  {
    match: 'anthropic',
    hint: {
      name: 'Anthropic',
      prefix: 'sk-ant-',
      dashboardUrl: 'https://console.anthropic.com/settings/keys',
    },
  },
  {
    match: 'resend',
    hint: {
      name: 'Resend',
      prefix: 're_',
      dashboardUrl: 'https://resend.com/api-keys',
    },
  },
  {
    match: 'stripe',
    hint: {
      name: 'Stripe',
      dashboardUrl: 'https://dashboard.stripe.com/apikeys',
    },
  },
]

export function getProviderHint(keyName: string): ElicitationProviderHint | undefined {
  const needle = keyName.toLowerCase()
  return PROVIDER_HINTS.find(({ match }) => needle.includes(match))?.hint
}
