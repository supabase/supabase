import assert from 'node:assert'

import { combineFunctionsStats, getFunctionsStatsParams } from './functions-stats'
import { WrappedResult } from './types'
import { assertSelfHosted } from './util'
import { PROJECT_ANALYTICS_URL } from '@/lib/constants/api'

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

  if (name === 'functions.combined-stats') {
    const responses = await Promise.all(
      getFunctionsStatsParams(params).map((query) =>
        retrieveAnalyticsData({ name: 'logs.all', projectRef, params: query })
      )
    )
    const rows = []
    for (const response of responses) {
      if (response.error) return response
      if (response.data.error)
        return { data: undefined, error: new Error(response.data.error.message) }
      rows.push(...(response.data.result ?? []))
    }
    return { data: { result: combineFunctionsStats(rows) }, error: undefined }
  }

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

    if (!response.ok || result?.error) {
      const error = new Error(
        (typeof result?.error === 'string' ? result.error : result?.error?.message) ??
          `Failed to retrieve analytics data: ${response.statusText}`
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
