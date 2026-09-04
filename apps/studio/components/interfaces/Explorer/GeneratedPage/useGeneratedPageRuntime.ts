import { acceptUntrustedSql, untrustedSql } from '@supabase/pg-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect, useRef, useState } from 'react'

import {
  buildGeneratedPageDocument,
  clampGeneratedPageHeight,
  GENERATED_PAGE_INIT_MESSAGE,
  GENERATED_PAGE_INITIAL_HEIGHT,
  generatedPageFrameMessageSchema,
  type GeneratedPageFrameMessage,
  type GeneratedPageQueryResponse,
  type GeneratedPageSupabaseConfig,
} from './generated-page-document'
import {
  describeSupabaseClientWarning,
  getGeneratedPageErrorMessage,
  getSupabaseClientStatus,
  lookupApprovedQuery,
  selectPublicClientKey,
  type ApprovedGeneratedPageQueries,
} from './generated-page.utils'
import { resolveLogTimeRange } from '@/components/interfaces/QuerySources/LogTimeRange.utils'
import { useAPIKeys } from '@/data/api-keys/api-keys-query'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { isValidConnString } from '@/data/fetchers'
import { executeLogsSql } from '@/data/logs/execute-logs-sql-mutation'
import { acceptUntrustedLogsSql, untrustedLogSql } from '@/data/logs/safe-analytics-sql'
import { QUERY_SOURCE_REGISTRY } from '@/data/query-sources/query-source-registry'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { applyAutoLimit } from '@/data/sql/utils'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useLatest } from '@/hooks/misc/useLatest'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import type { RenderPageInput } from '@/lib/ai/tools/generated-page-schema'

export type GeneratedPageRun = { id: number; document: string }

/**
 * Everything needed to host one assistant-generated page, shared by the two surfaces that
 * can run one: the approval card in Assistant chat and the temporary Explorer tab.
 *
 * The security boundary lives here rather than in either surface, so there is exactly one
 * copy of it to audit:
 *
 * - `start()` is the ONLY place a generated query's SQL is promoted, and it must only ever
 *   be called from a click handler. Never call it from render, an effect, or a message
 *   handler — see the comment on the promotion itself.
 * - The frame addresses queries by id. Ids outside the approved map are refused before any
 *   execution path is reached.
 * - Rows live in the frame's memory and in this hook's closure. They are never returned to
 *   a tool, written to a message, or persisted.
 *
 * `approvedQueries` pre-seeds the approved set for a page that was already approved
 * elsewhere in this session and handed over in memory (chat → Explorer tab). It is only a
 * transfer of an existing approval; nothing is promoted when it is used.
 */
export function useGeneratedPageRuntime({
  page,
  approvedQueries,
}: {
  page: RenderPageInput | undefined
  approvedQueries?: ApprovedGeneratedPageQueries
}) {
  const { data: project } = useSelectedProjectQuery()
  const projectRef = project?.ref
  const connectionString = project?.connectionString

  const { can: canReadApiKeys, isLoading: isLoadingPermission } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'service_api_keys'
  )
  const { data: apiUrl, isPending: isLoadingApiUrl } = useProjectApiUrl({ projectRef })
  const { data: apiKeys, isLoading: isLoadingApiKeys } = useAPIKeys(
    { projectRef },
    { enabled: canReadApiKeys }
  )
  const clientKey = selectPublicClientKey(apiKeys)

  const approvedRef = useRef<ApprovedGeneratedPageQueries | null>(null)
  // Every open port for the current run. A page can be shown in more than one frame; each
  // gets its own channel, and a port that is not in this set is a torn-down run.
  const portsRef = useRef<Set<MessagePort>>(new Set())
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [run, setRun] = useState<GeneratedPageRun | null>(null)
  const [height, setHeight] = useState(GENERATED_PAGE_INITIAL_HEIGHT)

  const teardown = () => {
    for (const port of portsRef.current) port.close()
    portsRef.current.clear()
    approvedRef.current = null
  }

  const buildSupabaseConfig = (): GeneratedPageSupabaseConfig | undefined =>
    page?.enable_supabase_client === true && apiUrl !== undefined && clientKey !== undefined
      ? { projectUrl: apiUrl, publishableKey: clientKey.apiKey }
      : undefined

  const buildDocument = (): string =>
    buildGeneratedPageDocument({
      html: page?.html ?? '',
      databaseQueryIds: page?.database_queries.map((query) => query.id) ?? [],
      logQueryIds: page?.log_queries.map((query) => query.id) ?? [],
      supabase: buildSupabaseConfig(),
    })

  // Unmounting destroys the frame with the DOM; the channels and the approved fragments
  // have to be dropped explicitly so nothing outlives the surface that hosted them.
  useEffect(() => {
    // The Set instance is created once and only ever mutated, so capturing it here is the
    // same live collection the cleanup needs.
    const ports = portsRef.current
    return () => {
      for (const port of ports) port.close()
      ports.clear()
      approvedRef.current = null
    }
  }, [])

  // Switching projects must not leave a page running against credentials and approvals
  // that belonged to the previous project. The project query resolving for the first time
  // is not a switch — tearing down there would kill a page that started while it loaded.
  const previousProjectRef = useRef(projectRef)
  if (previousProjectRef.current !== projectRef) {
    const wasProjectLoaded = previousProjectRef.current !== undefined
    previousProjectRef.current = projectRef
    if (wasProjectLoaded) {
      teardown()
      if (run !== null) setRun(null)
      setHeight(GENERATED_PAGE_INITIAL_HEIGHT)
    }
  }

  // A page handed over already approved starts immediately: the approval gesture happened
  // on the surface that showed the user the SQL, and this only carries it across.
  const hasSeededApproval = useRef(false)
  if (approvedQueries !== undefined && !hasSeededApproval.current && page !== undefined) {
    hasSeededApproval.current = true
    approvedRef.current = approvedQueries
    setRun({ id: 1, document: buildDocument() })
  }

  const runQuery = async (
    message: Extract<GeneratedPageFrameMessage, { type: 'query' }>
  ): Promise<GeneratedPageQueryResponse> => {
    const base = { type: 'query-result' as const, requestId: message.requestId }
    const lookup = lookupApprovedQuery(approvedRef.current, message)

    if (lookup.status === 'rejected') {
      return { ...base, ok: false, error: { message: lookup.message } }
    }

    try {
      if (lookup.status === 'database') {
        if (projectRef === undefined || !isValidConnString(connectionString)) {
          throw new Error('Unable to run query: connection string is missing')
        }
        const limited = applyAutoLimit(lookup.query.sql, lookup.query.rowLimit)
        const { result } = await executeSql({
          projectRef,
          connectionString,
          sql: limited.sql,
          preflightCheck: true,
        })
        return { ...base, ok: true, rows: Array.isArray(result) ? result : [] }
      }

      if (projectRef === undefined) throw new Error('Unable to run query: no project selected')
      const result = await executeLogsSql({
        projectRef,
        sql: lookup.query.sql,
        range: resolveLogTimeRange(lookup.query.timeRange),
        endpoint: QUERY_SOURCE_REGISTRY.logs.endpoint,
      })
      if (result.error) throw result.error
      return { ...base, ok: true, rows: result.rows }
    } catch (error) {
      return { ...base, ok: false, error: { message: getGeneratedPageErrorMessage(error) } }
    }
  }

  const handleFrameMessage = (data: unknown, port: MessagePort) => {
    const parsedMessage = generatedPageFrameMessageSchema.safeParse(data)
    // Malformed traffic is dropped silently: replying would tell a misbehaving page
    // something about the parent it cannot otherwise observe.
    if (!parsedMessage.success) return

    if (parsedMessage.data.type === 'resize') {
      setHeight(clampGeneratedPageHeight(parsedMessage.data.height))
      return
    }

    const message = parsedMessage.data
    void runQuery(message).then((response) => {
      // A port that is no longer open belongs to a stopped or replaced run.
      if (!portsRef.current.has(port)) return
      port.postMessage(response)
    })
  }

  // The channel's `onmessage` is assigned once per frame load, so it would otherwise keep
  // running against the project and approvals captured at that moment.
  const latestFrameMessageHandler = useLatest(handleFrameMessage)

  const connectFrame = (frame: HTMLIFrameElement | null) => {
    const contentWindow = frame?.contentWindow
    if (contentWindow === null || contentWindow === undefined) return

    const channel = new MessageChannel()
    portsRef.current.add(channel.port1)
    channel.port1.onmessage = (event) =>
      latestFrameMessageHandler.current(event.data, channel.port1)
    channel.port1.start()
    // The frame has an opaque origin (no `allow-same-origin`), so `'*'` is the only
    // targetOrigin it can receive. The message goes to a window the caller created and
    // carries nothing but the port.
    contentWindow.postMessage({ type: GENERATED_PAGE_INIT_MESSAGE }, '*', [channel.port2])
  }

  const handleIframeLoad = () => connectFrame(iframeRef.current)

  /**
   * SECURITY BOUNDARY — the user's explicit start gesture.
   *
   * This is the only place a generated query's SQL is promoted from untrusted model output
   * to a runnable fragment. Call it from a click handler and nowhere else: not from render,
   * not from an effect, not from an iframe message handler.
   */
  const start = () => {
    if (page === undefined) return

    approvedRef.current = {
      database: new Map(
        page.database_queries.map((query) => [
          query.id,
          {
            title: query.title,
            sql: acceptUntrustedSql(untrustedSql(query.sql)),
            rowLimit: query.row_limit,
          },
        ])
      ),
      logs: new Map(
        page.log_queries.map((query) => [
          query.id,
          {
            title: query.title,
            sql: acceptUntrustedLogsSql(untrustedLogSql(query.sql)),
            timeRange: query.time_range,
          },
        ])
      ),
    }

    setHeight(GENERATED_PAGE_INITIAL_HEIGHT)
    // The document is built once per run and held in state so a later query settling — API
    // keys arriving, say — can't swap `srcDoc` underneath a page already in use.
    setRun((current) => ({ id: (current?.id ?? 0) + 1, document: buildDocument() }))
  }

  const stop = () => {
    teardown()
    setRun(null)
    setHeight(GENERATED_PAGE_INITIAL_HEIGHT)
  }

  const reload = () => {
    teardown()
    start()
  }

  const clientStatus = getSupabaseClientStatus({
    isRequested: page?.enable_supabase_client === true,
    usesClientInHtml: page?.html.includes('window.supabase') === true,
    isLoading: isLoadingPermission || isLoadingApiUrl || isLoadingApiKeys,
    canReadApiKeys,
    projectUrl: apiUrl,
    clientKey,
  })

  return {
    run,
    isRunning: run !== null,
    height,
    iframeRef,
    clientStatus,
    clientWarning: describeSupabaseClientWarning(clientStatus),
    /** The current approved set, for handing a running page to another surface. */
    getApprovedQueries: () => approvedRef.current,
    start,
    stop,
    reload,
    handleIframeLoad,
  }
}
