import type { HeatmapMode } from './contexts'

export const NODE_TYPE = 'plan'
export const DEFAULT_NODE_WIDTH = 180
export const DEFAULT_NODE_HEIGHT = 400
/**
 * @see: https://github.com/wbkd/react-flow/discussions/2698
 */
export const HIDDEN_NODE_CONNECTOR = 'opacity-0'

export const HEATMAP_ITEMS: readonly HeatmapMode[] = ['time', 'rows', 'cost', 'none']

export type NodeHeightConstants = Readonly<{
  HEADER_H: number
  HEADER_LINE_H: number
  ITEM_H: number
  PADDING: number
  HEATMAP_H: number
}>

export const DEFAULT_NODE_HEIGHT_CONSTANTS: NodeHeightConstants = {
  HEADER_H: 22,
  HEADER_LINE_H: 15,
  ITEM_H: 22,
  PADDING: 16,
  HEATMAP_H: 3,
}
