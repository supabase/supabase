import { PROJECT_ANALYTICS_URL } from 'lib/constants/api'
import { WrappedResult } from './types'
import { assertSelfHosted } from './util'
import assert from 'node:assert'
import { LogsService } from '@supabase/mcp-server-supabase/platform'
import { stripIndent } from 'common-tags'

export type RetrieveAnalyticsDataOptions = {
  name: string
  projectRef: string
  params: Record<string, string | undefined>
}

export type AnalyticsResult = {
  result?: any[]
  error?: {
    message: string
  }
  [key: string]: any
}

/**
 * Retrieves analytics data from Logflare.
 *
 * _Only call this from server-side self-hosted code._
 */
export async function retrieveAnalyticsData({
  name,
  projectRef,
  params,
}: RetrieveAnalyticsDataOptions): Promise<WrappedResult<AnalyticsResult>> {
  assertSelfHosted()
  assert(PROJECT_ANALYTICS_URL, 'PROJECT_ANALYTICS_URL is required')
  assert(process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN, 'LOGFLARE_PRIVATE_ACCESS_TOKEN is required')

  const url = new URL(`${PROJECT_ANALYTICS_URL}endpoints/query/${name}`)
  url.searchParams.set('project', projectRef)

  // Add all other params
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, value)
    }
  })

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })

    const result = await response.json()

    if (!response.ok) {
      const error = new Error(
        result?.error?.message ?? `Failed to retrieve analytics data: ${response.statusText}`
      )
      return { data: undefined, error }
    }

    return { data: result, error: undefined }
  } catch (error) {
    if (error instanceof Error) {
      return { data: undefined, error }
    }
    throw error
  }
}

export function getLogQuery(service: LogsService, limit: number = 100): string {
  assertSelfHosted()

  switch (service) {
    case 'api': {
      return stripIndent`
        select id, edge_logs.timestamp, event_message, request.method, request.path, request.search, response.status_code
        from edge_logs
        cross join unnest(metadata) as m
        cross join unnest(m.request) as request
        cross join unnest(m.response) as response
        order by timestamp desc
        limit ${limit};
      `
    }
    case 'branch-action': {
      throw new Error('Branching is only supported in the hosted Supabase platform')
    }
    case 'postgres': {
      return stripIndent`
        select postgres_logs.timestamp, id, event_message, parsed.error_severity, parsed.detail, parsed.hint
        from postgres_logs
        cross join unnest(metadata) as m
        cross join unnest(m.parsed) as parsed
        order by timestamp desc
        limit ${limit};
      `
    }
    case 'edge-function': {
      return stripIndent`
        select id, function_edge_logs.timestamp, event_message
        from function_edge_logs
        order by timestamp desc
        limit ${limit}
      `
    }
    case 'auth': {
      return stripIndent`
        select id, auth_logs.timestamp, event_message, metadata.level, metadata.status, metadata.path, metadata.msg as msg, metadata.error from auth_logs
        cross join unnest(metadata) as metadata
        order by timestamp desc
        limit ${limit};
      `
    }
    case 'storage': {
      return stripIndent`
        select id, storage_logs.timestamp, event_message from storage_logs
        order by timestamp desc
        limit ${limit};
      `
    }
    case 'realtime': {
      return stripIndent`
        select id, realtime_logs.timestamp, event_message from realtime_logs
        order by timestamp desc
        limit ${limit};
      `
    }
    default: {
      throw new Error(`Unsupported log service: ${service}`)
    }
  }
}
