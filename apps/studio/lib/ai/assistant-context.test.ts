import { describe, expect, it } from 'vitest'

import { buildAssistantContextMessages, NO_SCHEMA_ACCESS_MESSAGE } from '@/lib/ai/assistant-context'

const SCHEMAS = 'The available database schema names are: ["public"]'

describe('buildAssistantContextMessages', () => {
  it('describes the project when there is project context', () => {
    const messages = buildAssistantContextMessages({
      projectRef: 'abcdefghijklmnopqrst',
      chatName: 'Slow queries',
      schemasString: SCHEMAS,
      aiOptInLevel: 'schema',
      now: new Date('2026-08-20T06:53:00.000Z'),
    })

    expect(messages).toHaveLength(1)
    expect(messages[0].role).toBe('assistant')
    expect(messages[0].content).toContain('abcdefghijklmnopqrst')
    expect(messages[0].content).toContain(SCHEMAS)
    expect(messages[0].content).toContain('Slow queries')
    expect(messages[0].content).toContain('2026-08-20T06:53:00.000Z')
    expect(messages[0].content).toContain('iso_timestamp_start')
  })

  it('states the opt-in level so the model only asks for a higher one', () => {
    const messages = buildAssistantContextMessages({
      projectRef: 'abcdefghijklmnopqrst',
      schemasString: SCHEMAS,
      aiOptInLevel: 'schema_and_log_and_data',
    })

    expect(messages[0].content).toContain(
      "The organization's AI opt-in level is schema_and_log_and_data"
    )
  })

  it('omits the project message when there is nothing to say', () => {
    const messages = buildAssistantContextMessages({
      schemasString: NO_SCHEMA_ACCESS_MESSAGE,
      aiOptInLevel: 'schema',
    })

    expect(messages).toEqual([])
  })

  it('adds the support instructions in support mode', () => {
    const messages = buildAssistantContextMessages({
      schemasString: NO_SCHEMA_ACCESS_MESSAGE,
      aiOptInLevel: 'schema',
      supportMode: true,
    })

    expect(messages).toHaveLength(1)
    expect(messages[0].content).toContain('escalate_to_human')
  })

  it('adds ClickHouse instructions when the conversation attached a logs query', () => {
    const messages = buildAssistantContextMessages({
      projectRef: 'abcdefghijklmnopqrst',
      schemasString: SCHEMAS,
      aiOptInLevel: 'schema',
      includesLogsSnippets: true,
    })

    expect(messages).toHaveLength(2)
    const logsContext = messages[1].content
    // The dialect rules, so it doesn't answer in Postgres...
    expect(logsContext).toContain('ClickHouse')
    // ...and the table reference, so it doesn't invent BigQuery-style unnests.
    expect(logsContext).toContain('log_attributes')
    expect(logsContext).toContain("where source = 'edge_logs'")
    expect(logsContext).toContain('query_logs')
    expect(logsContext).not.toContain('cannot run')
  })

  it('adds nothing extra for a database-only conversation', () => {
    const messages = buildAssistantContextMessages({
      projectRef: 'abcdefghijklmnopqrst',
      schemasString: SCHEMAS,
      aiOptInLevel: 'schema',
      includesLogsSnippets: false,
    })

    expect(messages).toHaveLength(1)
    expect(messages[0].content).not.toContain('ClickHouse')
  })
})
