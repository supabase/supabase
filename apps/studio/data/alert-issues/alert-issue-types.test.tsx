import { useQuery } from '@tanstack/react-query'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { useAlertIssueTypeCreateMutation } from './alert-issue-type-create-mutation'
import { useAlertIssueTypeDeleteMutation } from './alert-issue-type-delete-mutation'
import { useAlertIssueTypeSilenceMutation } from './alert-issue-type-silence-mutation'
import { alertIssueTypesQueryOptions } from './alert-issue-types-query'
import { useAlertRulePreviewMutation } from './alert-rule-preview-mutation'
import { API_URL } from '@/lib/constants'
import { customRenderHook } from '@/tests/lib/custom-render'
import { mswServer } from '@/tests/lib/msw'

const REF = 'default'
const ALERTS = `${API_URL}/platform/projects/:ref/alerts`

const TYPE = {
  rule_key: 'supabase.advisors.security',
  name: 'Security advisor',
  description: 'Security lints from the database advisor.',
  category: 'security',
  severity: 'critical',
  managed: true,
  language: 'pg_sql',
  lql: null,
  group_by: ['lint_name', 'entity'],
  silenced: false,
  silence_id: null,
}

describe('alert issue types', () => {
  it('lists the alert issue types', async () => {
    mswServer.use(http.get(`${ALERTS}/issue-types`, () => HttpResponse.json([TYPE])))

    const { result } = customRenderHook(() =>
      useQuery({ ...alertIssueTypesQueryOptions({ projectRef: REF }), enabled: true })
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.[0]).toMatchObject({ rule_key: TYPE.rule_key, silenced: false })
  })

  it('silences an alert issue type and records the silence', async () => {
    let received: unknown
    mswServer.use(
      http.get(`${ALERTS}/issue-types`, () => HttpResponse.json([TYPE])),
      http.post(`${ALERTS}/silences`, async ({ request }) => {
        received = await request.json()
        return HttpResponse.json(
          { id: 's1', rule_key: TYPE.rule_key, matchers: { project: REF } },
          { status: 201 }
        )
      })
    )

    const { result } = customRenderHook(() => ({
      list: useQuery({ ...alertIssueTypesQueryOptions({ projectRef: REF }), enabled: true }),
      silence: useAlertIssueTypeSilenceMutation(),
    }))
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    result.current.silence.mutate({ projectRef: REF, ruleKey: TYPE.rule_key, enabled: false })

    await waitFor(() => expect(result.current.silence.isSuccess).toBe(true))
    expect(received).toEqual({ rule_key: TYPE.rule_key })
    expect(result.current.list.data?.[0]).toMatchObject({ silenced: true, silence_id: 's1' })
  })

  it('re-enables an alert issue type by deleting its silence', async () => {
    let deletedId: unknown
    mswServer.use(
      http.get(`${ALERTS}/issue-types`, () =>
        HttpResponse.json([{ ...TYPE, silenced: true, silence_id: 's1' }])
      ),
      http.delete(`${ALERTS}/silences/:silenceId`, ({ params }) => {
        deletedId = params.silenceId
        return HttpResponse.json({ id: params.silenceId })
      })
    )

    const { result } = customRenderHook(() => ({
      list: useQuery({ ...alertIssueTypesQueryOptions({ projectRef: REF }), enabled: true }),
      silence: useAlertIssueTypeSilenceMutation(),
    }))
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    result.current.silence.mutate({
      projectRef: REF,
      ruleKey: TYPE.rule_key,
      enabled: true,
      silenceId: 's1',
    })

    await waitFor(() => expect(result.current.silence.isSuccess).toBe(true))
    expect(deletedId).toBe('s1')
    expect(result.current.list.data?.[0]).toMatchObject({ silenced: false, silence_id: null })
  })

  it('creates a custom log rule', async () => {
    let received: unknown
    mswServer.use(
      http.post(`${ALERTS}/issue-types`, async ({ request }) => {
        received = await request.json()
        return HttpResponse.json(
          { ...TYPE, rule_key: 'custom.errors', name: 'Errors', managed: false, language: 'lql' },
          { status: 201 }
        )
      })
    )

    const { result } = customRenderHook(() => useAlertIssueTypeCreateMutation())
    result.current.mutate({
      projectRef: REF,
      name: 'Errors',
      lql: 'f:function_edge_logs m.status:>=500',
      severity: 'major',
      category: 'health',
      group_by: [],
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(received).toEqual({
      name: 'Errors',
      lql: 'f:function_edge_logs m.status:>=500',
      severity: 'major',
      category: 'health',
      group_by: [],
    })
    expect(result.current.data?.rule_key).toBe('custom.errors')
  })

  it('deletes a custom log rule', async () => {
    let deleted: unknown
    mswServer.use(
      http.delete(`${ALERTS}/issue-types/:ruleKey`, ({ params }) => {
        deleted = params.ruleKey
        return HttpResponse.json({ rule_key: params.ruleKey })
      })
    )

    const { result } = customRenderHook(() => useAlertIssueTypeDeleteMutation())
    result.current.mutate({ projectRef: REF, ruleKey: 'custom.errors' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(deleted).toBe('custom.errors')
  })

  it('previews the log events an LQL filter matches', async () => {
    let received: { lql?: string } = {}
    mswServer.use(
      http.post(`${ALERTS}/preview`, async ({ request }) => {
        received = (await request.json()) as { lql: string }
        return HttpResponse.json({
          lql: received.lql,
          source: 'function_edge_logs',
          from: '2026-11-16T11:00:00Z',
          to: '2026-11-16T12:00:00Z',
          total: 0,
          buckets: [],
          events: [],
        })
      })
    )

    const { result } = customRenderHook(() => useAlertRulePreviewMutation())
    result.current.mutate({ projectRef: REF, lql: 'f:function_edge_logs m.status:>=500' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(received.lql).toBe('f:function_edge_logs m.status:>=500')
    expect(result.current.data?.total).toBe(0)
  })
})
