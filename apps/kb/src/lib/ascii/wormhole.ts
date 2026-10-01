export interface WormholeShape {
  cx: number
  rimY: number
  throatY: number
  r0: number
}

export interface WormholePoint {
  x: number
  y: number
}

interface ProjectParams {
  shape: WormholeShape
  r: number
  angle: number
  flatten: number
  lineY: number
}

interface IsBehindWallParams {
  shape: WormholeShape
  radii: number[]
  r: number
  angle: number
}

interface LocateCellParams {
  shape: WormholeShape
  radii: number[]
  spokeCount: number
  x: number
  y: number
  flatten: number
  lineY: number
}

export interface WormholeCell {
  ring: number
  spoke: number
}

interface RingRadiiParams {
  r0: number
  maxRadius: number
}

const TILT = 0.42
const THROAT_FLATTENING = 0.6

export const ringRadii = ({ r0, maxRadius }: RingRadiiParams): number[] => {
  const radii: number[] = []
  for (let i = 0; ; i++) {
    const r = r0 * (1 + 0.1 * i + 0.012 * i * i)
    radii.push(r)
    if (r > maxRadius) return radii
  }
}

const ringEllipse = ({ rimY, throatY, r0 }: WormholeShape, r: number) => ({
  centerY: rimY + (throatY - rimY) * (r0 / r),
  ry: TILT * (r - THROAT_FLATTENING * r0),
})

export const projectWormhole = ({
  shape,
  r,
  angle,
  flatten,
  lineY,
}: ProjectParams): WormholePoint => {
  const { centerY, ry } = ringEllipse(shape, r)
  const y = centerY + ry * Math.sin(angle)
  return { x: shape.cx + r * Math.cos(angle), y: lineY + (y - lineY) * (1 - flatten) }
}

export const isBehindWall = ({ shape, radii, r, angle }: IsBehindWallParams): boolean => {
  if (Math.sin(angle) <= 0) return false
  const { x, y } = projectWormhole({ shape, r, angle, flatten: 0, lineY: 0 })
  const dx = x - shape.cx
  return radii.some((inner) => {
    if (inner >= r || Math.abs(dx) >= inner) return false
    const { centerY, ry } = ringEllipse(shape, inner)
    return centerY + ry * Math.sqrt(1 - (dx / inner) ** 2) > y + 0.5
  })
}

export const locateCell = ({
  shape,
  radii,
  spokeCount,
  x,
  y,
  flatten,
  lineY,
}: LocateCellParams): WormholeCell | null => {
  if (flatten >= 1) return null
  const unflattenedY = lineY + (y - lineY) / (1 - flatten)
  const dx = x - shape.cx
  const outer = radii.findIndex((r) => {
    const { centerY, ry } = ringEllipse(shape, r)
    return (dx / r) ** 2 + ((unflattenedY - centerY) / ry) ** 2 <= 1
  })
  if (outer <= 0) return null
  const { centerY, ry } = ringEllipse(shape, radii[outer])
  const angle = Math.atan2((unflattenedY - centerY) / ry, dx / radii[outer])
  const turn = (angle + Math.PI * 2) % (Math.PI * 2)
  return { ring: outer - 1, spoke: Math.floor((turn / (Math.PI * 2)) * spokeCount) % spokeCount }
}

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
