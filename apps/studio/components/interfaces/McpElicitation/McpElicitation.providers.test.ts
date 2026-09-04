import { describe, expect, it } from 'vitest'

import { getProviderHint } from './McpElicitation.providers'

describe('getProviderHint', () => {
  it('matches the provider anywhere in the name, case-insensitively', () => {
    for (const name of ['OPENAI_API_KEY', 'openai-key', 'prod_OpenAi_token']) {
      expect(getProviderHint(name)?.name).toBe('OpenAI')
    }
  })

  it('carries the prefix and dashboard link the form renders', () => {
    expect(getProviderHint('RESEND_API_KEY')).toEqual({
      name: 'Resend',
      prefix: 're_',
      dashboardUrl: 'https://resend.com/api-keys',
    })
  })

  it('keeps providers with several valid key shapes prefix-free', () => {
    expect(getProviderHint('STRIPE_SECRET_KEY')?.prefix).toBeUndefined()
    expect(getProviderHint('STRIPE_SECRET_KEY')?.dashboardUrl).toBe(
      'https://dashboard.stripe.com/apikeys'
    )
  })

  it('does not confuse providers whose key prefixes overlap', () => {
    expect(getProviderHint('ANTHROPIC_API_KEY')?.prefix).toBe('sk-ant-')
    expect(getProviderHint('OPENAI_API_KEY')?.prefix).toBe('sk-')
  })

  it('gives no hint at all for a name it does not recognize', () => {
    expect(getProviderHint('MY_WEBHOOK_TOKEN')).toBeUndefined()
    expect(getProviderHint('')).toBeUndefined()
  })
})
