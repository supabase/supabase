import type { Topic } from './topics'

export type IsoPoint = [number, number]

export interface IsoBox {
  x: number
  y: number
  z: number
  w: number
  d: number
  h: number
  inset?: 'front' | 'top'
}

export interface IsoComposition {
  boxes: IsoBox[]
  titleAt: 'top' | 'bottom'
}

export interface ProjectedBox {
  key: string
  faces: IsoPoint[][]
  hiddenEdges: [IsoPoint, IsoPoint][]
  insets: IsoPoint[][]
  guides: [IsoPoint, IsoPoint][]
}

const COS = Math.cos(Math.PI / 6)
const SIN = 0.5
const GUIDE_REACH = 1.6
const INSET_MARGIN = 0.18
const INSET_DEPTH = 0.12

export const isoPoint = (x: number, y: number, z: number): IsoPoint => [
  (x - y) * COS,
  (x + y) * SIN - z,
]

const cube = (x: number, y: number, z: number, size: number): IsoBox => ({
  x,
  y,
  z,
  w: size,
  d: size,
  h: size,
})

export const paintOrder = (boxes: IsoBox[]): IsoBox[] =>
  [...boxes].sort(
    (a, b) => a.x + a.w / 2 + a.y + a.d / 2 + a.z - (b.x + b.w / 2 + b.y + b.d / 2 + b.z)
  )

export const projectBox = (box: IsoBox): ProjectedBox => {
  const { x, y, z, w, d, h, inset } = box
  const p = (px: number, py: number, pz: number) => isoPoint(px, py, pz)
  const right = [p(x + w, y, z), p(x + w, y + d, z), p(x + w, y + d, z + h), p(x + w, y, z + h)]
  const left = [p(x, y + d, z), p(x + w, y + d, z), p(x + w, y + d, z + h), p(x, y + d, z + h)]
  const top = [p(x, y, z + h), p(x + w, y, z + h), p(x + w, y + d, z + h), p(x, y + d, z + h)]
  const back = p(x, y, z)
  const mw = w * INSET_MARGIN
  const md = d * INSET_MARGIN
  const mh = h * INSET_MARGIN

  const frontInset = (depth: number) => [
    p(x + w - depth, y + md, z + mh),
    p(x + w - depth, y + d - md, z + mh),
    p(x + w - depth, y + d - md, z + h - mh),
    p(x + w - depth, y + md, z + h - mh),
  ]
  const topInset = (depth: number) => [
    p(x + mw, y + md, z + h - depth),
    p(x + w - mw, y + md, z + h - depth),
    p(x + w - mw, y + d - md, z + h - depth),
    p(x + mw, y + d - md, z + h - depth),
  ]
  const insetFace = inset === 'front' ? frontInset : inset === 'top' ? topInset : null

  return {
    key: `${x}:${y}:${z}`,
    faces: [right, left, top],
    hiddenEdges: [
      [back, p(x + w, y, z)],
      [back, p(x, y + d, z)],
      [back, p(x, y, z + h)],
    ],
    insets: insetFace ? [insetFace(0), insetFace(w * INSET_DEPTH)] : [],
    guides: [
      [p(x - GUIDE_REACH, y + d, z), p(x + w + GUIDE_REACH, y + d, z)],
      [p(x + w, y - GUIDE_REACH, z), p(x + w, y + d + GUIDE_REACH, z)],
    ],
  }
}

export const compositionBounds = (boxes: ProjectedBox[], padding = 0.25) => {
  const points = boxes.flatMap((box) => box.faces.flat())
  const xs = points.map(([px]) => px)
  const ys = points.map(([, py]) => py)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const width = Math.max(...xs) - minX
  const height = Math.max(...ys) - minY
  const pad = Math.max(width, height) * padding
  return { x: minX - pad, y: minY - pad, width: width + pad * 2, height: height + pad * 2 }
}

export const ISO_COMPOSITIONS: Record<Topic, IsoComposition> = {
  Auth: {
    titleAt: 'bottom',
    boxes: [cube(0, 0, 0, 1), { ...cube(0, 0, 1, 1), inset: 'front' }, cube(0, 0, 2, 1)],
  },
  Database: {
    titleAt: 'top',
    boxes: Array.from({ length: 5 }, (_, i) => ({
      x: i * 0.1,
      y: -i * 0.12,
      z: i * 0.24,
      w: 2,
      d: 1.3,
      h: 0.16,
    })),
  },
  Realtime: {
    titleAt: 'top',
    boxes: [{ ...cube(0, 0, 0, 2), inset: 'front' }, cube(2.3, 1.2, 0, 0.7)],
  },
  Storage: {
    titleAt: 'top',
    boxes: [0, 1, 2].map((i) => ({ ...cube(0, i * 1.35, 0, 1.1), h: 0.8, inset: 'top' })),
  },
  'Edge Functions': {
    titleAt: 'top',
    boxes: [
      cube(0, 0, 0, 1),
      cube(1.9, 0.3, 0, 0.4),
      cube(0.3, 1.9, 0, 0.4),
      cube(-1.3, 0.3, 0, 0.4),
      cube(0.3, -1.3, 0, 0.4),
    ],
  },
  Queues: {
    titleAt: 'top',
    boxes: [0, 1, 2, 3, 4].map((i) => cube(i * 0.95, 0, 0, 0.7)),
  },
  Migration: {
    titleAt: 'top',
    boxes: [
      { ...cube(0, 0, 0, 1), h: 1.2 },
      cube(1.5, 0.3, 0.2, 0.4),
      { ...cube(2.6, 0, 0, 1), h: 1.2, inset: 'top' },
    ],
  },
  Comparison: {
    titleAt: 'bottom',
    boxes: [
      { ...cube(0, 0, 0, 0.9), h: 2.2 },
      { ...cube(1.4, 0, 0, 0.9), h: 1.4 },
    ],
  },
  Troubleshooting: {
    titleAt: 'bottom',
    boxes: [
      { ...cube(0, 0, 0, 1), h: 0.8 },
      { ...cube(0.25, -0.15, 0.8, 1), h: 0.8 },
      { ...cube(-0.1, 0.1, 1.6, 1), h: 0.8 },
    ],
  },
  Tutorial: {
    titleAt: 'top',
    boxes: [0, 1, 2, 3].map((i) => ({ x: i * 0.8, y: 0, z: 0, w: 0.8, d: 1.2, h: (i + 1) * 0.45 })),
  },
  'Supabase Platform': {
    titleAt: 'top',
    boxes: [0, 1, 2].map((i) => ({ x: 0, y: 0, z: i * 0.55, w: 2.2, d: 2.2, h: 0.18 })),
  },
}

export const FALLBACK_COMPOSITION: IsoComposition = { titleAt: 'top', boxes: [cube(0, 0, 0, 1)] }
