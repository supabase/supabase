export interface RowLayoutConfig {
  columnWidth: number
  columnGap: number
}

export interface ColumnPosition {
  x: number
  width: number
}

/**
 * Position evenly-spaced columns centered around `centerX`. Returns a map from
 * each node id to its center-x coordinate.
 */
export function buildRowLayout(
  nodeIds: string[],
  centerX: number,
  config: RowLayoutConfig
): Map<string, ColumnPosition> {
  const positions = new Map<string, ColumnPosition>()
  if (nodeIds.length === 0) return positions

  const totalWidth =
    nodeIds.length * config.columnWidth + config.columnGap * Math.max(0, nodeIds.length - 1)
  let cursor = centerX - totalWidth / 2

  for (const nodeId of nodeIds) {
    const center = cursor + config.columnWidth / 2
    positions.set(nodeId, { x: center, width: config.columnWidth })
    cursor = center + config.columnWidth / 2 + config.columnGap
  }

  return positions
}
