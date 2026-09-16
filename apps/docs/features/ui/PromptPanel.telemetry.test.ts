import { describe, expect, it } from 'vitest'

/**
 * Guards the payloads `PromptPanel` actually emits. The `_typeCheck` assignment
 * fails `tsc --noEmit` if `docs_ai_prompt_copied` leaves the `TelemetryEvent`
 * union or its property types drift; the expectations pin the shapes each
 * consumer sends.
 */
describe('TelemetryEvent union', () => {
  it('includes docs_ai_prompt_copied from the homepage prompt tab', () => {
    const event = {
      action: 'docs_ai_prompt_copied' as const,
      properties: { source: 'homepage' as const, tab: 'prompt' as const },
    }

    const _typeCheck: import('common/telemetry-constants').TelemetryEvent = event
    expect(_typeCheck.action).toBe('docs_ai_prompt_copied')
    expect(event.properties).toEqual({ source: 'homepage', tab: 'prompt' })
  })

  it('includes docs_ai_prompt_copied from the homepage CLI tab', () => {
    const event = {
      action: 'docs_ai_prompt_copied' as const,
      properties: { source: 'homepage' as const, tab: 'cli' as const },
    }

    const _typeCheck: import('common/telemetry-constants').TelemetryEvent = event
    expect(_typeCheck.action).toBe('docs_ai_prompt_copied')
    expect(event.properties).toEqual({ source: 'homepage', tab: 'cli' })
  })

  it('includes docs_ai_prompt_copied from a guide AiPrompt block', () => {
    const event = {
      action: 'docs_ai_prompt_copied' as const,
      properties: { source: 'guide' as const, tab: 'prompt' as const, promptId: 'nextjs' },
    }

    const _typeCheck: import('common/telemetry-constants').TelemetryEvent = event
    expect(_typeCheck.action).toBe('docs_ai_prompt_copied')
    expect(event.properties).toEqual({ source: 'guide', tab: 'prompt', promptId: 'nextjs' })
  })

  it('includes docs_ai_prompt_copied from an AgentSetup panel', () => {
    const event = {
      action: 'docs_ai_prompt_copied' as const,
      properties: {
        source: 'agent_setup' as const,
        tab: 'prompt' as const,
        promptId: 'monitoring-agent-health',
      },
    }

    const _typeCheck: import('common/telemetry-constants').TelemetryEvent = event
    expect(_typeCheck.action).toBe('docs_ai_prompt_copied')
    expect(event.properties).toEqual({
      source: 'agent_setup',
      tab: 'prompt',
      promptId: 'monitoring-agent-health',
    })
  })
})
