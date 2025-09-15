import type { HeatmapMode, MetricsVisibility } from './contexts'

export const NODE_TYPE = 'plan'
export const DEFAULT_NODE_WIDTH = 180
export const DEFAULT_NODE_HEIGHT = 400
/**
 * @see: https://github.com/wbkd/react-flow/discussions/2698
 */
export const HIDDEN_NODE_CONNECTOR = 'opacity-0'

export const HEATMAP_ITEMS: HeatmapMode[] = ['time', 'rows', 'cost', 'none']

export const SHOW_ITEMS: { label: string; value: keyof MetricsVisibility }[] = [
  { label: 'Time', value: 'time' },
  { label: 'Rows', value: 'rows' },
  { label: 'Cost', value: 'cost' },
  { label: 'Buffers', value: 'buffers' },
  { label: 'Output', value: 'output' },
]
