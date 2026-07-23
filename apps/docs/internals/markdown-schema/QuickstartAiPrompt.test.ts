import { describe, expect, it } from 'vitest'

import prompts from '../../data/quickstart-prompts.json'
import { QuickstartAiPrompt } from './QuickstartAiPrompt'

describe('QuickstartAiPrompt markdown schema', () => {
  it('exports the title and body from the JSON lookup', () => {
    expect(
      QuickstartAiPrompt({
        props: { framework: 'nextjs' },
        children: '',
      })
    ).toBe(`**AI Prompt**\n\n${prompts.nextjs}`)
  })

  it('keeps the title when the framework is unknown', () => {
    expect(
      QuickstartAiPrompt({
        props: { framework: 'not-a-framework' },
        children: '',
      })
    ).toBe('**AI Prompt**')
  })

  it('keeps the title when framework is missing', () => {
    expect(QuickstartAiPrompt({ props: {}, children: '' })).toBe('**AI Prompt**')
  })
})
