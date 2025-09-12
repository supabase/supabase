import { createContext } from 'react'

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
  cost: false,
  buffers: false,
  output: false,
}

export const MetricsVisibilityContext = createContext<MetricsVisibility>(defaultMetricsVisibility)

export type HeatmapMode = 'none' | 'time' | 'rows' | 'cost'

export type HeatmapMeta = {
  mode: HeatmapMode
  maxTime: number
  maxRows: number
  maxCost: number
}

export const defaultHeatmapMeta: HeatmapMeta = {
  mode: 'time',
  maxTime: 1,
  maxRows: 1,
  maxCost: 1,
}

export const HeatmapContext = createContext<HeatmapMeta>(defaultHeatmapMeta)
