import type { StepResult, ToolSet } from 'ai'
import { describe, expect, it } from 'vitest'

import { buildTranscript } from './transcript'

// Minimal fixtures matching only the `content` shape buildTranscript reads —
// no need to fully populate the rest of StepResult's fields.
const makeStep = (content: unknown[]): StepResult<ToolSet> =>
  ({ content }) as unknown as StepResult<ToolSet>

describe('buildTranscript', () => {
  it('serializes a single step with only a text part', () => {
    const steps = [makeStep([{ type: 'text', text: 'Here is your answer.' }])]

    const transcript = buildTranscript('What is the answer?', steps)

    expect(transcript.currentUserInput).toBe('What is the answer?')
    expect(transcript.priorConversation).toBeNull()
    expect(transcript.lastAssistantTurn).toBe('Here is your answer.')
    expect(transcript.lastAssistantTurnWithToolInputs).toBe('Here is your answer.')
  })

  it('serializes a single step with only a tool-call part', () => {
    const steps = [
      makeStep([{ type: 'tool-call', toolName: 'execute_sql', input: { sql: 'select 1;' } }]),
    ]

    const transcript = buildTranscript('Run a query.', steps)

    expect(transcript.lastAssistantTurn).toBe('[called execute_sql]')
    expect(transcript.lastAssistantTurnWithToolInputs).toBe(
      '[called execute_sql]\n' + JSON.stringify({ sql: 'select 1;' }, null, 2)
    )
  })

  it('joins multiple steps in order with a blank line between them', () => {
    const steps = [
      makeStep([{ type: 'text', text: 'Let me check that.' }]),
      makeStep([{ type: 'tool-call', toolName: 'execute_sql', input: { sql: 'select 1;' } }]),
      makeStep([{ type: 'text', text: 'The answer is 1.' }]),
    ]

    const transcript = buildTranscript('What is 1?', steps)

    expect(transcript.lastAssistantTurn).toBe(
      'Let me check that.\n\n[called execute_sql]\n\nThe answer is 1.'
    )
    expect(transcript.lastAssistantTurnWithToolInputs).toBe(
      'Let me check that.\n\n[called execute_sql]\n' +
        JSON.stringify({ sql: 'select 1;' }, null, 2) +
        '\n\nThe answer is 1.'
    )
    expect(transcript.lastAssistantTurn?.endsWith('The answer is 1.')).toBe(true)
  })

  it('skips reasoning and tool-result content parts', () => {
    const steps = [
      makeStep([
        { type: 'reasoning', text: 'Thinking about the best approach...' },
        { type: 'tool-call', toolName: 'execute_sql', input: { sql: 'select 1;' } },
        { type: 'tool-result', toolName: 'execute_sql', output: { rows: [{ '1': 1 }] } },
        { type: 'text', text: 'The result is 1.' },
      ]),
    ]

    const transcript = buildTranscript('What is 1?', steps)

    expect(transcript.lastAssistantTurn).toBe('[called execute_sql]\nThe result is 1.')
    expect(transcript.lastAssistantTurn).not.toContain('Thinking about the best approach')
    expect(transcript.lastAssistantTurn).not.toContain('rows')
  })

  it('returns null transcripts for an empty steps array', () => {
    const transcript = buildTranscript('Hello', [])

    expect(transcript.lastAssistantTurn).toBeNull()
    expect(transcript.lastAssistantTurnWithToolInputs).toBeNull()
  })
})
