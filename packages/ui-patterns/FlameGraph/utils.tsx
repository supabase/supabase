import { FlameGraphDataItem } from '.'

export const FLAME_GRAPH_GREEN_GRADIENT = [
  '#dcfce7',
  '#bbf7d0',
  '#86efac',
  '#4ade80',
  '#22c55e',
  '#16a34a',
  '#15803d',
  '#166534',
  '#14532d',
]

export function getBalancedColors(count: number) {
  if (count === 9) {
    return FLAME_GRAPH_GREEN_GRADIENT
  }

  const result = []
  // Calculate the step size to evenly distribute selections
  const step = (FLAME_GRAPH_GREEN_GRADIENT.length - 1) / (count - 1)

  // Handle special case for count = 1
  if (count === 1) {
    return [FLAME_GRAPH_GREEN_GRADIENT[4]] // Middle color (5th item)
  }

  // For all other cases, distribute evenly
  for (let i = 0; i < count; i++) {
    const index = Math.round(i * step)
    result.push(FLAME_GRAPH_GREEN_GRADIENT[index])
  }

  return result
}

export function getFlameGraphColor(
  item: FlameGraphDataItem,
  colorMode: 'width' | 'peaks',
  level: number,
  maxLevel: number,
  maxWidth: number
) {
  const widthStep = Math.floor(maxWidth / 9)
  const levelStep = Math.floor(maxLevel / 9)

  if (item.color) {
    return item.color
  }

  if (colorMode === 'peaks') {
    if (maxLevel >= 9) {
      return FLAME_GRAPH_GREEN_GRADIENT[
        FLAME_GRAPH_GREEN_GRADIENT.length - Math.min(Math.floor(level / levelStep), 8) - 1
      ]
    }

    return FLAME_GRAPH_GREEN_GRADIENT[FLAME_GRAPH_GREEN_GRADIENT.length - level - 1]
  }

  if (colorMode === 'width') {
    const itemWidth = item.end_value - item.start_value
    return FLAME_GRAPH_GREEN_GRADIENT[Math.min(Math.floor(itemWidth / widthStep), 8)]
  }

  return FLAME_GRAPH_GREEN_GRADIENT[4]
}

export function isValidateData(data: FlameGraphDataItem[]): [boolean, string] {
  // there should only be 1 FlameGraphDataItem with no parent_id
  const rootItems = data.filter((item) => item.parent_id === '')

  if (rootItems.length === 0) {
    return [false, 'There is no root item in the data. Add at least one item with no parent_id.']
  }

  if (rootItems.length > 1) {
    return [
      false,
      'There are more than 1 root item with no parent_id. Please wrap all these data in a single item with no parent_id.',
    ]
  }

  return [true, '']
}
