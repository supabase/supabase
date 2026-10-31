import { describe, expect, it } from 'vitest'

import { groupLogAttributes } from './attributeSections'

const sectionSummary = (attributes: Record<string, unknown>) =>
  groupLogAttributes(attributes).map((section) => ({
    id: section.id,
    labels: section.fields.map((field) => field.label),
  }))

describe('groupLogAttributes', () => {
  it('handles empty attributes', () => {
    expect(groupLogAttributes({})).toEqual([])
  })

  it('groups storage, Postgres, and Auth event fields without losing their values', () => {
    const sections = groupLogAttributes({
      'req.method': 'POST',
      'req.headers.host': 'example.com',
      'res.statusCode': 200,
      'res.headers.content_type': 'application/json',
      'parsed.detail': 'detail',
      'auth_event.action': 'login',
      'auth_audit_event.actor': { id: 'user-1' },
    })
    expect(sections.map(({ id }) => id)).toEqual([
      'request',
      'response',
      'postgres',
      'event',
      'request-headers',
      'response-headers',
    ])
    expect(sections.find(({ id }) => id === 'event')?.fields).toEqual([
      { key: 'auth_audit_event.actor', label: 'actor', value: { id: 'user-1' } },
      { key: 'auth_event.action', label: 'action', value: 'login' },
    ])
  })

  it('groups gateway attributes by prefix, most specific first', () => {
    expect(
      sectionSummary({
        'request.method': 'GET',
        'request.path': '/rest/v1/todos',
        'request.headers.user_agent': 'curl',
        'request.cf.country': 'NZ',
        'request.sb.jwt.authorization.payload.role': 'anon',
        'response.status_code': '200',
        'response.headers.cf_ray': '8f00-IAD',
        identifier: 'abc',
      })
    ).toEqual([
      { id: 'details', labels: ['identifier'] },
      { id: 'request', labels: ['method', 'path'] },
      { id: 'response', labels: ['status_code'] },
      { id: 'auth', labels: ['jwt.authorization.payload.role'] },
      { id: 'client', labels: ['country'] },
      { id: 'request-headers', labels: ['user_agent'] },
      { id: 'response-headers', labels: ['cf_ray'] },
    ])
  })

  it('puts top-level keys in details and unknown dotted keys in other', () => {
    expect(
      sectionSummary({ event_type: 'Log', execution_id: 'e1', 'context.host': 'worker-1' })
    ).toEqual([
      { id: 'details', labels: ['event_type', 'execution_id'] },
      { id: 'other', labels: ['context.host'] },
    ])
  })

  it('drops empty values but keeps false and zero', () => {
    expect(sectionSummary({ a: '', b: null, c: undefined, d: 0, e: false })).toEqual([
      { id: 'details', labels: ['d', 'e'] },
    ])
  })
})
