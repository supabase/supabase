import type { ElicitationProviderHint } from './McpElicitation.types'

/**
 * Where to send a user who doesn't have their key yet, and what shape that key
 * usually takes.
 *
 * Matched case-insensitively against the secret name, so `OPENAI_API_KEY`,
 * `openai-key` and `prod_openai` all land on the same entry. A name we don't
 * recognize gets no hint at all rather than a guess — the footer and the prefix
 * warning both disappear.
 *
 * `prefix` is omitted where a provider issues several equally valid shapes:
 * warning about the wrong one is worse than staying quiet.
 */
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
    // Secret, restricted and publishable keys all start differently, so no prefix.
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
