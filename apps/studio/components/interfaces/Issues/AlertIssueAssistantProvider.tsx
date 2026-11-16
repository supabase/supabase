import { acceptUntrustedSql, type SafeSqlFragment } from '@supabase/pg-meta'
import { useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

import { buildAssistantAnswer } from './AlertIssueAssistant.answers'
import {
  buildAssistantPlan,
  buildAssistantPrompt,
  buildPersistedReply,
  summarizeAssistantRun,
  summarizeLogEvents,
  type AssistantContext,
  type AssistantStep,
  type AssistantStepResult,
} from './AlertIssueAssistant.utils'
import { useAlertIssueCommentCreateMutation } from '@/data/alert-issues/alert-issue-comment-create-mutation'
import { alertIssueEventsQueryOptions } from '@/data/alert-issues/alert-issue-events-query'
import type { AlertIssue } from '@/data/alert-issues/alert-issue.schema'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useGrant } from '@/lib/grants'

export type AssistantStepStatus = 'pending' | 'running' | 'done' | 'failed'

export type AssistantRunState = {
  steps: { step: AssistantStep; status: AssistantStepStatus; detail?: string }[]
  answer: string
  isAnswering: boolean
}

/** A run whose SQL was accepted in the event handler of the user's request. */
export type PreparedAssistantRun = {
  context: AssistantContext
  steps: AssistantStep[]
  acceptedSql: Record<string, SafeSqlFragment>
}

type AlertIssueAssistantValue = {
  run: AssistantRunState | null
  isBusy: boolean
  /** Call from an event handler only: it accepts the plan's read-only SQL for execution. */
  prepare: (context: AssistantContext) => PreparedAssistantRun
  start: (prepared: PreparedAssistantRun) => void
  /** Call from an event handler only. Posts the @assistant comment, then starts the run. */
  ask: (question: string, context: AssistantContext) => void
}

const AlertIssueAssistantContext = createContext<AlertIssueAssistantValue | null>(null)

/** The assistant for the alert issue being viewed, or null outside an alert issue. */
export const useAlertIssueAssistant = () => useContext(AlertIssueAssistantContext)

const wait = (ms: number) =>
  ms > 0 ? new Promise<void>((resolve) => setTimeout(resolve, ms)) : Promise.resolve()

const WORDS_PER_TICK = 3

type AlertIssueAssistantProviderProps = {
  projectRef: string
  issue: AlertIssue
  /** Pause between steps, to make the simulated run readable. */
  stepDelayMs?: number
  /** Pause between streamed chunks of the answer. */
  wordDelayMs?: number
  children: ReactNode
}

export const AlertIssueAssistantProvider = ({
  projectRef,
  issue,
  stepDelayMs = 900,
  wordDelayMs = 30,
  children,
}: AlertIssueAssistantProviderProps) => {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const readGrant = useGrant(
    'POST /platform/pg-meta/{ref}/query',
    { projectRef },
    { variant: 'read' }
  )
  const { mutateAsync: postComment } = useAlertIssueCommentCreateMutation()
  const [run, setRun] = useState<AssistantRunState | null>(null)
  const isActive = useRef(true)

  useEffect(() => {
    isActive.current = true
    return () => {
      isActive.current = false
    }
  }, [])

  const updateStep = (index: number, status: AssistantStepStatus, detail?: string) =>
    setRun((current) =>
      current
        ? {
            ...current,
            steps: current.steps.map((entry, i) =>
              i === index ? { ...entry, status, detail: detail ?? entry.detail } : entry
            ),
          }
        : current
    )

  const runTool = async (
    step: AssistantStep,
    prepared: PreparedAssistantRun
  ): Promise<{ result: AssistantStepResult; detail?: string; isFailed?: boolean }> => {
    switch (step.kind) {
      case 'read_finding':
        return { result: { kind: 'read_finding' }, detail: issue.title }
      case 'check_docs':
        return { result: { kind: 'check_docs', url: step.url }, detail: step.url }
      case 'reuse_result':
        return {
          result: { kind: 'run_sql', title: step.title, rows: step.rows },
          detail: `${step.rows.length} ${step.rows.length === 1 ? 'row' : 'rows'}`,
        }
      case 'read_logs': {
        const data = await queryClient
          .fetchQuery(
            alertIssueEventsQueryOptions({
              projectRef,
              alertIssueId: issue.alert_issue_id,
              range: '24h',
            })
          )
          .catch(() => null)
        const summary = data ? summarizeLogEvents(data.events) : null
        return {
          result: { kind: 'read_logs', summary },
          detail: summary ? `${summary.total} log events` : 'No log preview for this alert issue',
        }
      }
      case 'run_sql': {
        const sql = prepared.acceptedSql[step.id]
        if (!sql || !readGrant.grant) {
          return {
            result: { kind: 'run_sql', title: step.title, error: 'Not run' },
            isFailed: true,
          }
        }
        try {
          const { result } = await executeSql<Record<string, unknown>[]>({
            projectRef,
            connectionString: project?.connectionString,
            sql,
            sqlOrigin: 'user',
            grant: readGrant.grant,
          })
          const rows = Array.isArray(result) ? result : []
          return {
            result: { kind: 'run_sql', title: step.title, rows },
            detail: `${step.sql.trim()} → ${rows.length} ${rows.length === 1 ? 'row' : 'rows'}`,
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Query failed'
          return {
            result: { kind: 'run_sql', title: step.title, error: message },
            detail: message,
            isFailed: true,
          }
        }
      }
    }
  }

  const start = (prepared: PreparedAssistantRun) => {
    const execute = async () => {
      setRun({
        steps: prepared.steps.map((step) => ({ step, status: 'pending' })),
        answer: '',
        isAnswering: false,
      })
      const results: AssistantStepResult[] = []
      for (const [index, step] of prepared.steps.entries()) {
        if (!isActive.current) return
        updateStep(index, 'running')
        await wait(stepDelayMs)
        const { result, detail, isFailed } = await runTool(step, prepared)
        results.push(result)
        updateStep(index, isFailed ? 'failed' : 'done', detail)
      }

      const answer = buildAssistantAnswer(issue, prepared.context, results)
      const tokens = answer.split(/(\s+)/)
      setRun((current) => (current ? { ...current, isAnswering: true } : current))
      for (let end = WORDS_PER_TICK; end < tokens.length + WORDS_PER_TICK; end += WORDS_PER_TICK) {
        if (!isActive.current) return
        await wait(wordDelayMs)
        const partial = tokens.slice(0, end).join('')
        setRun((current) => (current ? { ...current, answer: partial } : current))
      }

      await postComment({
        projectRef,
        alertIssueId: issue.alert_issue_id,
        body: buildPersistedReply(summarizeAssistantRun(results), answer),
        asAssistant: true,
      }).catch(() => undefined)
      if (isActive.current) setRun(null)
    }
    void execute()
  }

  const prepare = (context: AssistantContext): PreparedAssistantRun => {
    const steps = buildAssistantPlan(issue, context)
    const acceptedSql = Object.fromEntries(
      steps.flatMap((step) =>
        step.kind === 'run_sql' ? [[step.id, acceptUntrustedSql(step.sql)]] : []
      )
    )
    return { context, steps, acceptedSql }
  }

  const ask = (question: string, context: AssistantContext) => {
    const prepared = prepare(context)
    postComment({
      projectRef,
      alertIssueId: issue.alert_issue_id,
      body: buildAssistantPrompt(question, context),
    }).then(
      () => start(prepared),
      () => undefined
    )
  }

  return (
    <AlertIssueAssistantContext.Provider value={{ run, isBusy: run !== null, prepare, start, ask }}>
      {children}
    </AlertIssueAssistantContext.Provider>
  )
}
