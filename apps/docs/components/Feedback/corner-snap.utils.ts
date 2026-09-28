export type DockCorner = (typeof DOCK_CORNERS)[number]

export type DockPlacement = DockCorner | 'center'

export type DockArrowKey = (typeof DOCK_ARROW_KEYS)[number]

export interface Point {
  x: number
  y: number
}

interface CornerParts {
  vertical: 'top' | 'bottom'
  horizontal: 'left' | 'right'
}

export const DOCK_CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const

export const DEFAULT_DOCK_CORNER: DockCorner = 'bottom-right'

export const DOCK_ARROW_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'] as const

const CENTER_BAND_SHARE = 1 / 3

const CORNER_PARTS: Record<DockCorner, CornerParts> = {
  'top-left': { vertical: 'top', horizontal: 'left' },
  'top-right': { vertical: 'top', horizontal: 'right' },
  'bottom-left': { vertical: 'bottom', horizontal: 'left' },
  'bottom-right': { vertical: 'bottom', horizontal: 'right' },
}

export const getNearestPlacement = ({
  point,
  velocity,
  viewport,
  canCenter,
}: {
  point: Point
  velocity: Point
  viewport: { width: number; height: number }
  canCenter: boolean
}): DockPlacement => {
  const x = point.x + project(velocity.x)
  const y = point.y + project(velocity.y)
  const isInCenterBand = Math.abs(x - viewport.width / 2) < (viewport.width * CENTER_BAND_SHARE) / 2
  if (canCenter && isInCenterBand && y >= viewport.height / 2) return 'center'

  return toCorner({
    vertical: y < viewport.height / 2 ? 'top' : 'bottom',
    horizontal: x < viewport.width / 2 ? 'left' : 'right',
  })
}

export const parseStoredCorner = (value: unknown): DockCorner =>
  DOCK_CORNERS.find((corner) => corner === value) ?? DEFAULT_DOCK_CORNER

export const getAdjacentPlacement = ({
  placement,
  key,
  canCenter,
}: {
  placement: DockPlacement
  key: DockArrowKey
  canCenter: boolean
}): DockPlacement => {
  if (placement === 'center') {
    if (key === 'ArrowLeft') return 'bottom-left'
    if (key === 'ArrowRight') return 'bottom-right'
    return placement
  }
  const isTowardCenter =
    (placement === 'bottom-left' && key === 'ArrowRight') ||
    (placement === 'bottom-right' && key === 'ArrowLeft')
  if (canCenter && isTowardCenter) return 'center'

  const { vertical, horizontal } = CORNER_PARTS[placement]

  switch (key) {
    case 'ArrowLeft':
      return toCorner({ vertical, horizontal: 'left' })
    case 'ArrowRight':
      return toCorner({ vertical, horizontal: 'right' })
    case 'ArrowUp':
      return toCorner({ vertical: 'top', horizontal })
    case 'ArrowDown':
      return toCorner({ vertical: 'bottom', horizontal })
  }
}

const project = (velocity: number, rate = 0.999) => ((velocity / 1000) * rate) / (1 - rate)

const toCorner = ({ vertical, horizontal }: CornerParts): DockCorner => `${vertical}-${horizontal}`
