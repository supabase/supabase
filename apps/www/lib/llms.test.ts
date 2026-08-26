import { describe, expect, it } from 'vitest'

import { generatePricingContent } from './llms'

describe('generatePricingContent', () => {
  it('builds without throwing and carries the derived billing example', () => {
    let content = ''
    expect(() => {
      content = generatePricingContent()
    }).not.toThrow()
    expect(content).toContain('in compute credits')
    expect(content).toContain('## Disk Storage')
    expect(content).toContain('Structured pricing data (JSON): https://supabase.com/pricing.json')
  })
})
