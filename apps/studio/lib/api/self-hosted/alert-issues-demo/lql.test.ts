import { describe, expect, it } from 'vitest'

import { fillLqlTemplate, matchesLql, parseLql } from './lql'

const event = {
  event_message: 'POST | 504 | https://default.supabase.co/functions/v1/stripe-webhook',
  body: {
    name: 'rls_disabled_in_public',
    metadata: { function_id: 'stripe-webhook', status_code: 504, level: 'error' },
  },
}

describe('parseLql', () => {
  it('reads the source and the filters', () => {
    expect(
      parseLql('f:function_edge_logs m.status_code:>=500 m.function_id:"stripe-webhook"')
    ).toEqual({
      source: 'function_edge_logs',
      filters: [
        { path: ['metadata', 'status_code'], operator: '>=', value: '500', negated: false },
        {
          path: ['metadata', 'function_id'],
          operator: '=',
          value: 'stripe-webhook',
          negated: false,
        },
      ],
    })
  })

  it('reads free text, top-level fields and negation', () => {
    expect(parseLql('timeout -m.level:info name:rls_disabled_in_public').filters).toEqual([
      { path: ['event_message'], operator: '~', value: 'timeout', negated: false },
      { path: ['metadata', 'level'], operator: '=', value: 'info', negated: true },
      { path: ['name'], operator: '=', value: 'rls_disabled_in_public', negated: false },
    ])
  })
})

describe('matchesLql', () => {
  it.each([
    ['m.status_code:>=500', true],
    ['m.status_code:<500', false],
    ['m.level:error', true],
    ['m.function_id:"stripe-webhook"', true],
    ['m.function_id:"send-email"', false],
    ['-m.level:error', false],
    ['"stripe-webhook"', true],
    ['name:rls_disabled_in_public', true],
  ])('%s → %s', (lql, expected) => {
    expect(matchesLql(event, parseLql(lql).filters)).toBe(expected)
  })
})

describe('fillLqlTemplate', () => {
  it('fills placeholders with quoted identifier values', () => {
    expect(
      fillLqlTemplate('f:function_edge_logs m.function_id:{{function_id}}', {
        function_id: 'stripe-webhook',
      })
    ).toEqual({ lql: 'f:function_edge_logs m.function_id:"stripe-webhook"' })
  })

  it('reports a missing identifier', () => {
    expect(fillLqlTemplate('m.function_id:{{function_id}}', {})).toEqual({
      error: 'Missing identifier function_id',
    })
  })
})
