import { createContext } from 'react'

// Metrics visibility context and types
export type MetricsVisibility = {
  time: boolean
  rows: boolean
  cost: boolean
  buffers: boolean
  output: boolean
}

export const defaultMetricsVisibility: MetricsVisibility = {
  time: true,
  rows: true,
  cost: true,
  buffers: true,
  output: true,
}

export const MetricsVisibilityContext = createContext<MetricsVisibility>(defaultMetricsVisibility)

// Heatmap context and types
export type HeatmapMode = 'none' | 'time' | 'rows' | 'cost'

export type HeatmapMeta = {
  mode: HeatmapMode
  maxTime: number
  maxRows: number
  maxCost: number
}

export const defaultHeatmapMeta: HeatmapMeta = {
  mode: 'none',
  maxTime: 1,
  maxRows: 1,
  maxCost: 1,
}

export const HeatmapContext = createContext<HeatmapMeta>(defaultHeatmapMeta)
