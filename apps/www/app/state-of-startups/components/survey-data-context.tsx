'use client'

import { createClient } from '@supabase/supabase-js'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { statKey, transformSurveyRows } from '../lib/preload-survey-data'
import type { SurveyYear } from './year-context'

export interface ChartDataItem {
  label: string
  value: number
  rawValue: number
}

export type StatAggregation = 'single' | 'multi' | 'boolean'

export interface StatColumnRow {
  label: string
  count: number
}

export interface StatColumnData {
  rows: StatColumnRow[]
  respondentCount: number
}

export type SurveyDataCache = Record<string, ChartDataItem[]>
export type SurveyStatCache = Record<string, StatColumnData>

interface SurveyDataContextValue {
  /** Returns cached chart data for an (rpcName, params) combo, or undefined. */
  get: (rpcName: string, params: Record<string, any>) => ChartDataItem[] | undefined
  /** Returns cached stat-column data for a (year, column) pair, or undefined. */
  getStat: (year: SurveyYear, column: string) => StatColumnData | undefined
  /** Fetches and caches a non-default chart filter combo. */
  fetchAndCache: (rpcName: string, params: Record<string, any>) => Promise<ChartDataItem[]>
}

const SurveyDataContext = createContext<SurveyDataContextValue | null>(null)

const surveyClient = createClient(
  process.env.NEXT_PUBLIC_SURVEY_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SURVEY_SUPABASE_ANON_KEY!
)

function paramsKey(params: Record<string, any>): string {
  const keys = Object.keys(params).sort()
  if (keys.length === 0) return ''
  return JSON.stringify(keys.map((k) => [k, params[k]]))
}

function cacheKey(rpcName: string, params: Record<string, any>): string {
  return `${rpcName}::${paramsKey(params)}`
}

export function SurveyDataProvider({
  preloadedData,
  preloadedStats,
  children,
}: {
  preloadedData: SurveyDataCache
  preloadedStats: SurveyStatCache
  children: ReactNode
}) {
  const [cache, setCache] = useState<Map<string, ChartDataItem[]>>(() => {
    const initial = new Map<string, ChartDataItem[]>()
    for (const [rpcName, data] of Object.entries(preloadedData)) {
      initial.set(cacheKey(rpcName, {}), data)
    }
    return initial
  })

  const statCache = useMemo(() => {
    const map = new Map<string, StatColumnData>()
    for (const [key, value] of Object.entries(preloadedStats)) {
      map.set(key, value)
    }
    return map
  }, [preloadedStats])

  const inflight = useRef<Map<string, Promise<ChartDataItem[]>>>(new Map())

  const get = useCallback(
    (rpcName: string, params: Record<string, any>) => cache.get(cacheKey(rpcName, params)),
    [cache]
  )

  const getStat = useCallback(
    (year: SurveyYear, column: string) => statCache.get(statKey(year, column)),
    [statCache]
  )

  const fetchAndCache = useCallback(
    async (rpcName: string, params: Record<string, any>) => {
      const key = cacheKey(rpcName, params)
      const cached = cache.get(key)
      if (cached) return cached

      const existing = inflight.current.get(key)
      if (existing) return existing

      const promise = (async () => {
        const { data, error } = await surveyClient.rpc(rpcName, params)
        if (error) throw error
        const transformed = transformSurveyRows(data ?? [])
        setCache((prev) => {
          const next = new Map(prev)
          next.set(key, transformed)
          return next
        })
        return transformed
      })().finally(() => {
        inflight.current.delete(key)
      })

      inflight.current.set(key, promise)
      return promise
    },
    [cache]
  )

  const value = useMemo(() => ({ get, getStat, fetchAndCache }), [get, getStat, fetchAndCache])

  return <SurveyDataContext.Provider value={value}>{children}</SurveyDataContext.Provider>
}

export function useSurveyDataCache() {
  const ctx = useContext(SurveyDataContext)
  if (!ctx) {
    throw new Error('useSurveyDataCache must be used within a SurveyDataProvider')
  }
  return ctx
}
