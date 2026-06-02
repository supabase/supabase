'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export type SurveyYear = 2025 | 2026

export const SURVEY_YEARS: readonly SurveyYear[] = [2025, 2026] as const

interface YearContextValue {
  year: SurveyYear
  setYear: (year: SurveyYear) => void
}

const YearContext = createContext<YearContextValue | null>(null)

export function YearProvider({
  children,
  defaultYear = 2026,
}: {
  children: ReactNode
  defaultYear?: SurveyYear
}) {
  const [year, setYear] = useState<SurveyYear>(defaultYear)
  return <YearContext.Provider value={{ year, setYear }}>{children}</YearContext.Provider>
}

export function useYear() {
  const ctx = useContext(YearContext)
  if (!ctx) {
    throw new Error('useYear must be used within a YearProvider')
  }
  return ctx
}

export function rpcNameForYear(baseName: string, year: SurveyYear) {
  return year === 2026 ? `${baseName}_2026` : baseName
}
