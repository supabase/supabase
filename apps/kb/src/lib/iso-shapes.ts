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
  // a cylinder fills the box footprint, so keep w equal to d
  shape?: 'box' | 'cylinder'
}

// front looks at the stack from slightly above, like the classic database icon
export type IsoView = 'iso' | 'front'

// a flat screen-space circle centered on a point in the scene
export interface IsoRing {
  x: number
  y: number
  z: number
  radius: number
  // dashed rings draw themselves in while the card is hovered
  isDashed?: boolean
}

export interface IsoComposition {
  boxes: IsoBox[]
  titleAt: 'top' | 'bottom'
  view?: IsoView
  rings?: IsoRing[]
}

export interface ProjectedShape extends ProjectedBox {
  // plan positions of the visible vertical edges, for guides drawn when a shape lifts
  posts: [number, number][]
}

interface ProjectShapeParams {
  box: IsoBox
  view?: IsoView
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
const FRONT_TILT = 0.35
const FRONT_TURN_COS = Math.cos(Math.PI / 9)
const FRONT_TURN_SIN = Math.sin(Math.PI / 9)
const CYLINDER_SEGMENTS = 48

export const isoPoint = (x: number, y: number, z: number): IsoPoint => [
  (x - y) * COS,
  (x + y) * SIN - z,
]

export const VIEW_POINTS: Record<IsoView, (x: number, y: number, z: number) => IsoPoint> = {
  iso: isoPoint,
  // turned a little, so boxes show a narrow side face. circles look the same at all angles
  front: (x, y, z) => [
    x * FRONT_TURN_COS - y * FRONT_TURN_SIN,
    (x * FRONT_TURN_SIN + y * FRONT_TURN_COS) * FRONT_TILT - z,
  ],
}

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

export const projectBox = (box: IsoBox, p = isoPoint): ProjectedBox => {
  const { x, y, z, w, d, h, inset } = box
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

export const projectShape = ({ box, view = 'iso' }: ProjectShapeParams): ProjectedShape => {
  const { x, y, z, w, d, h } = box
  if (box.shape !== 'cylinder') {
    return {
      ...projectBox(box, VIEW_POINTS[view]),
      posts: [
        [x + w, y],
        [x + w, y + d],
        [x, y + d],
      ],
    }
  }
  const point = VIEW_POINTS[view]
  const radius = w / 2
  const plan = Array.from({ length: CYLINDER_SEGMENTS }, (_, i): [number, number] => {
    const angle = (i / CYLINDER_SEGMENTS) * Math.PI * 2
    return [x + radius + Math.cos(angle) * radius, y + radius + Math.sin(angle) * radius]
  })
  const base = plan.map(([px, py]) => point(px, py, z))
  const top = plan.map(([px, py]) => point(px, py, z + h))
  const pick = (score: (p: IsoPoint) => number) =>
    plan[base.reduce((best, p, i) => (score(p) > score(base[best]) ? i : best), 0)]
  return {
    key: `${x}:${y}:${z}`,
    // the hull of both rims is the side outline. the top rim covers its far half
    faces: [convexHull([...base, ...top]), top],
    hiddenEdges: [],
    insets: [],
    guides: [],
    posts: [pick(([px]) => -px), pick(([, py]) => py), pick(([px]) => px)],
  }
}

// monotone chain
export const convexHull = (points: IsoPoint[]): IsoPoint[] => {
  const sorted = [...points].sort(([ax, ay], [bx, by]) => ax - bx || ay - by)
  const cross = (o: IsoPoint, a: IsoPoint, b: IsoPoint) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = (list: IsoPoint[]) =>
    list.reduce<IsoPoint[]>((hull, p) => {
      while (hull.length >= 2 && cross(hull[hull.length - 2], hull[hull.length - 1], p) <= 0) {
        hull.pop()
      }
      hull.push(p)
      return hull
    }, [])
  const lower = half(sorted)
  const upper = half([...sorted].reverse())
  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}

export const compositionBounds = (boxes: Pick<ProjectedBox, 'faces'>[], padding = 0.25) => {
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
    view: 'front',
    boxes: [0, 1, 2].map((i) => ({
      x: 0,
      y: 0,
      z: i * 0.5,
      w: 2,
      d: 2,
      h: 0.38,
      shape: 'cylinder',
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
  // source and target cubes in rings, with a dashed orbit between them
  Migration: {
    titleAt: 'top',
    boxes: [cube(0, 0, 0, 1), cube(2.3, -2.3, 0, 1)],
    rings: [
      { x: 0.5, y: 0.5, z: 0.5, radius: 1.5 },
      { x: 1.65, y: -0.65, z: 0.5, radius: 1.5, isDashed: true },
      { x: 2.8, y: -1.8, z: 0.5, radius: 1.5 },
    ],
  },
  Comparison: {
    titleAt: 'bottom',
    boxes: [
      { ...cube(0, 0, 0, 0.9), h: 2.2 },
      { ...cube(1.4, 0, 0, 0.9), h: 1.4 },
    ],
  },
  Rundowns: {
    titleAt: 'bottom',
    boxes: [1.6, 2.2, 1, 1.8].map((h, i) => ({ ...cube(i * 1.1, 0, 0, 0.8), h })),
  },
  Troubleshooting: {
    titleAt: 'bottom',
    boxes: [
      { ...cube(0, 0, 0, 1), h: 0.8 },
      { ...cube(0.25, -0.15, 0.8, 1), h: 0.8 },
      { ...cube(-0.1, 0.1, 1.6, 1), h: 0.8 },
    ],
  },
  // stacks of one to four blocks climb like steps
  Tutorials: {
    titleAt: 'top',
    view: 'front',
    boxes: [0, 1, 2, 3].flatMap((step) =>
      Array.from({ length: step + 1 }, (_, i) => ({
        x: step,
        y: 0,
        z: i * 0.56,
        w: 0.88,
        d: 0.88,
        h: 0.5,
      }))
    ),
  },
  Platform: {
    titleAt: 'top',
    boxes: [0, 1, 2].map((i) => ({ x: 0, y: 0, z: i * 0.55, w: 2.2, d: 2.2, h: 0.18 })),
  },
}

export const FALLBACK_COMPOSITION: IsoComposition = { titleAt: 'top', boxes: [cube(0, 0, 0, 1)] }
