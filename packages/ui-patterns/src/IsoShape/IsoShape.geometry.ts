export type IsoPoint = [number, number]

export interface IsoBox {
  x: number
  y: number
  z: number
  w: number
  d: number
  h: number
  inset?: 'front' | 'top'
  fillFace?: IsoFace
  fillFlow?: 'up' | 'down'
  // a cylinder fills the box footprint, so keep w equal to d
  shape?: 'box' | 'cylinder'
  alsoLifts?: IsoBox[]
}

export type IsoView = 'iso' | 'front'

type PlanPoint = [number, number]

export interface IsoTurn {
  yaw: number
  pivot: PlanPoint
}

type IsoFace = 'right' | 'left' | 'top'

export interface IsoRing {
  x: number
  y: number
  z: number
  radius: number
  isDashed?: boolean
}

interface ProjectedShape extends ProjectedBox {
  // plan positions of the visible vertical edges, for guides drawn when a shape lifts
  posts: [number, number][]
  fill: IsoPoint[]
}

interface ProjectShapeParams {
  box: IsoBox
  view?: IsoView
  turn?: IsoTurn
}

interface RecessParams {
  opening: IsoPoint[]
  floor: IsoPoint[]
  inset: NonNullable<IsoBox['inset']>
}

interface RingBoundsParams {
  rings: IsoRing[]
  view?: IsoView
}

interface ProjectedBox {
  key: string
  faces: IsoPoint[][]
  hiddenEdges: [IsoPoint, IsoPoint][]
  insets: IsoPoint[][]
  guides: [IsoPoint, IsoPoint][]
}

const COS = Math.cos(Math.PI / 6)
const GUIDE_REACH = 1.6
const INSET_MARGIN = 0.18
const FRONT_TURN_COS = Math.cos(Math.PI / 9)
const FRONT_TURN_SIN = Math.sin(Math.PI / 9)
const CYLINDER_SEGMENTS = 48

const isoPoint = (x: number, y: number, z: number): IsoPoint => [(x - y) * COS, (x + y) * 0.5 - z]

export const VIEW_POINTS: Record<IsoView, (x: number, y: number, z: number) => IsoPoint> = {
  iso: isoPoint,
  // turned a little, so boxes show a narrow side face. circles look the same at all angles
  front: (x, y, z) => [
    x * FRONT_TURN_COS - y * FRONT_TURN_SIN,
    (x * FRONT_TURN_SIN + y * FRONT_TURN_COS) * 0.35 - z,
  ],
}

const rotateVector = ([px, py]: PlanPoint, yaw: number): PlanPoint => [
  px * Math.cos(yaw) - py * Math.sin(yaw),
  px * Math.sin(yaw) + py * Math.cos(yaw),
]

export const turnPoint = ([px, py]: PlanPoint, { yaw, pivot }: IsoTurn): PlanPoint => {
  const [dx, dy] = rotateVector([px - pivot[0], py - pivot[1]], yaw)
  return [pivot[0] + dx, pivot[1] + dy]
}

const turnedView = (view: IsoView, turn?: IsoTurn) => {
  const point = VIEW_POINTS[view]
  if (!turn) return point
  return (x: number, y: number, z: number) => point(...turnPoint([x, y], turn), z)
}

// the center of the plan footprint, so a turn keeps the composition in place
export const planCenter = (boxes: IsoBox[]): PlanPoint => {
  const xs = boxes.flatMap(({ x, w }) => [x, x + w])
  const ys = boxes.flatMap(({ y, d }) => [y, y + d])
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]
}

export const cube = (x: number, y: number, z: number, size: number): IsoBox => ({
  x,
  y,
  z,
  w: size,
  d: size,
  h: size,
})

export const paintOrder = (boxes: IsoBox[], turn?: IsoTurn): IsoBox[] => {
  const depth = ({ x, y, z, w, d }: IsoBox) => {
    const center: PlanPoint = [x + w / 2, y + d / 2]
    const [cx, cy] = turn ? turnPoint(center, turn) : center
    return cx + cy + z
  }
  return [...boxes].sort((a, b) => depth(a) - depth(b))
}

const projectBox = (
  box: IsoBox,
  p: (x: number, y: number, z: number) => IsoPoint,
  isVisible: (normal: PlanPoint) => boolean
): ProjectedBox & { namedFaces: Record<IsoFace, IsoPoint[]> } => {
  const { x, y, z, w, d, h, inset } = box
  const right = [p(x + w, y, z), p(x + w, y + d, z), p(x + w, y + d, z + h), p(x + w, y, z + h)]
  const left = [p(x, y + d, z), p(x + w, y + d, z), p(x + w, y + d, z + h), p(x, y + d, z + h)]
  // the far sides show only after a turn moves them into view
  const sides: [PlanPoint, IsoPoint[]][] = [
    [[1, 0], right],
    [[0, 1], left],
    [
      [-1, 0],
      [p(x, y, z), p(x, y + d, z), p(x, y + d, z + h), p(x, y, z + h)],
    ],
    [
      [0, -1],
      [p(x, y, z), p(x + w, y, z), p(x + w, y, z + h), p(x, y, z + h)],
    ],
  ]
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
  const insetFace = { front: frontInset, top: topInset }

  return {
    // a turn changes which sides show, so find the fill face by name, not by its index in faces
    namedFaces: { right, left, top },
    key: `${x}:${y}:${z}`,
    faces: [...sides.filter(([normal]) => isVisible(normal)).map(([, face]) => face), top],
    hiddenEdges: [
      [back, p(x + w, y, z)],
      [back, p(x, y + d, z)],
      [back, p(x, y, z + h)],
    ],
    insets:
      inset && (inset === 'top' || isVisible([1, 0]))
        ? recess({ opening: insetFace[inset](0), floor: insetFace[inset](w * 0.12), inset })
        : [],
    guides: [
      [p(x - GUIDE_REACH, y + d, z), p(x + w + GUIDE_REACH, y + d, z)],
      [p(x + w, y - GUIDE_REACH, z), p(x + w, y + d + GUIDE_REACH, z)],
    ],
  }
}

export const projectShape = ({ box, view = 'iso', turn }: ProjectShapeParams): ProjectedShape => {
  const { x, y, z, w, d, h } = box
  if (box.shape !== 'cylinder') {
    const { namedFaces, ...projected } = projectBox(box, turnedView(view, turn), (normal) => {
      const [nx, ny] = turn ? rotateVector(normal, turn.yaw) : normal
      // the plan direction toward the viewer, so a side face shows when its normal points along it
      const [vx, vy] = view === 'iso' ? [1, 1] : [FRONT_TURN_SIN, FRONT_TURN_COS]
      return nx * vx + ny * vy > 1e-6
    })
    return {
      ...projected,
      posts: [
        [x + w, y],
        [x + w, y + d],
        [x, y + d],
      ],
      fill: box.fillFace
        ? namedFaces[box.fillFace]
        : (projected.insets.at(-1) ?? convexHull(projected.faces.flat())),
    }
  }
  const point = turnedView(view, turn)
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
    fill: top,
  }
}

// the last polygon is the floor, because projectShape takes it as the fill area
const recess = ({ opening, floor, inset }: RecessParams): IsoPoint[][] => {
  const visibleFloor = clipPolygon(floor, opening)
  if (inset === 'top') {
    const [, right, front, left] = opening
    const [, floorRight, floorFront, floorLeft] = floor
    return [opening, [right, front, left, floorLeft, floorFront, floorRight], visibleFloor]
  }
  // a floor corner that clipping keeps is inside the opening, so its depth edge shows
  const depthEdges = floor.flatMap((corner, i) =>
    visibleFloor.includes(corner) ? [[opening[i], corner]] : []
  )
  return [opening, ...depthEdges, visibleFloor]
}

const cross = (o: IsoPoint, a: IsoPoint, b: IsoPoint) =>
  (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

// sutherland-hodgman. the clip polygon must be convex
const clipPolygon = (subject: IsoPoint[], clip: IsoPoint[]): IsoPoint[] => {
  const turn = Math.sign(cross(clip[0], clip[1], clip[2]))
  return clip.reduce((output, a, i) => {
    const b = clip[(i + 1) % clip.length]
    const side = (p: IsoPoint) => turn * cross(a, b, p)
    const crossing = (p: IsoPoint, q: IsoPoint): IsoPoint => {
      const t = side(p) / (side(p) - side(q))
      return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]
    }
    return output.flatMap((q, j) => {
      const p = output[(j + output.length - 1) % output.length]
      if (side(q) >= 0) return side(p) >= 0 ? [q] : [crossing(p, q), q]
      return side(p) >= 0 ? [crossing(p, q)] : []
    })
  }, subject)
}

// monotone chain
export const convexHull = (points: IsoPoint[]): IsoPoint[] => {
  const sorted = [...points].sort(([ax, ay], [bx, by]) => ax - bx || ay - by)
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

// a ring's square, so compositionBounds fits rings like boxes
export const ringBounds = ({
  rings,
  view = 'iso',
}: RingBoundsParams): Pick<ProjectedBox, 'faces'>[] =>
  rings.map((ring) => {
    const [cx, cy] = VIEW_POINTS[view](ring.x, ring.y, ring.z)
    return {
      faces: [
        [
          [cx - ring.radius, cy - ring.radius],
          [cx + ring.radius, cy + ring.radius],
        ],
      ],
    }
  })
