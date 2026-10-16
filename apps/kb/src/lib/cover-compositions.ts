import { cube, type IsoBox, type IsoRing, type IsoView } from './iso-shapes'
import type { Topic } from './topics'

interface IsoComposition {
  boxes: IsoBox[]
  titleAt: 'top' | 'bottom'
  view?: IsoView
  rings?: IsoRing[]
  fillBoxes?: IsoBox[]
  nudgeY?: number
  zoom?: number
}

const LOCK_BODY: IsoBox = { x: 0, y: 0, z: 0, w: 0.8, d: 1.8, h: 1.3, inset: 'front' }

const DATABASE_DISKS: IsoBox[] = [0, 0.5, 1.026].map((z) => ({
  x: 0,
  y: 0,
  z,
  w: 2,
  d: 2,
  h: 0.38,
  shape: 'cylinder',
}))

const REALTIME_SCREEN: IsoBox = { ...cube(0, 0, 0, 2), inset: 'front' }

const EDGE_NODES: IsoBox[] = [
  { ...cube(2.35, 0.2, 0, 0.4), fillFace: 'left' },
  { ...cube(0.2, 2.35, 0, 0.4), fillFace: 'right' },
  { ...cube(-1.75, 0.4, 0, 0.4), fillFace: 'right' },
  { ...cube(0.4, -1.75, 0, 0.4), fillFace: 'left' },
]

const QUEUE_CUBES: IsoBox[] = [0, 1, 2, 3, 4].map((i) => ({
  ...cube(i * 0.95, 0, 0, 0.7),
  fillFace: 'right',
}))

const MIGRATION_SOURCE: IsoBox = { ...cube(0, 0, 0, 1), fillFace: 'right' }
const MIGRATION_TARGET: IsoBox = { ...cube(2.3, -2.3, 0, 1), fillFace: 'left' }

const COMPARISON_TALL: IsoBox = { ...cube(0, 0, 0, 0.9), h: 2.2, fillFace: 'right' }

const RUNDOWN_BARS: IsoBox[] = [1.6, 2.2, 1, 1.8].map((h, i) => ({
  ...cube(i * 1.1, 0, 0, 0.8),
  h,
  fillFace: 'right',
}))

const TROUBLESHOOTING_SLABS: IsoBox[] = [
  cube(-0.1, 0.1, 0, 1),
  cube(0.274, -0.174, 0.8, 1.14),
  cube(-0.1, 0.1, 1.6, 1),
].map((slab) => ({ ...slab, h: 0.8, fillFace: 'top' }))

const TUTORIAL_STEPS: IsoBox[][] = [0, 1, 2, 3].map((step) =>
  Array.from({ length: step + 1 }, (_, i) => ({
    x: step,
    y: 0,
    z: i * 0.56,
    w: 0.88,
    d: 0.88,
    h: 0.5,
    fillFace: 'top',
  }))
)

const PLATFORM_LAYERS: IsoBox[] = [0, 1, 2].map((i) => ({
  x: 0,
  y: 0,
  z: i * 0.55,
  w: 2.2,
  d: 2.2,
  h: 0.18,
  fillFace: 'top',
}))

export const ISO_COMPOSITIONS: Record<Topic, IsoComposition> = {
  Auth: {
    titleAt: 'bottom',
    boxes: [
      LOCK_BODY,
      { x: 0.3, y: 0.3, z: 1.3, w: 0.2, d: 0.2, h: 0.6 },
      { x: 0.3, y: 1.3, z: 1.3, w: 0.2, d: 0.2, h: 0.6 },
      { x: 0.3, y: 0.3, z: 1.9, w: 0.2, d: 1.2, h: 0.2 },
    ],
    fillBoxes: [LOCK_BODY],
  },
  Database: {
    titleAt: 'top',
    view: 'front',
    boxes: DATABASE_DISKS,
    fillBoxes: DATABASE_DISKS.slice(1, 2),
    nudgeY: -4,
    zoom: 0.805,
  },
  Realtime: {
    titleAt: 'top',
    boxes: [REALTIME_SCREEN, { ...cube(2.3, 1.2, 0, 0.7), alsoLifts: [REALTIME_SCREEN] }],
    fillBoxes: [REALTIME_SCREEN],
    zoom: 0.88,
  },
  Storage: {
    titleAt: 'top',
    boxes: [
      [0.048, -0.048],
      [0, 1.35],
      [-0.012, 2.712],
    ].map(([x, y]) => ({ ...cube(x, y, 0, 1.1), h: 0.8, inset: 'top' })),
  },
  'Edge Functions': {
    titleAt: 'top',
    boxes: [cube(0.112, 0.088, 0, 1.34), ...EDGE_NODES],
    fillBoxes: EDGE_NODES,
    nudgeY: 7,
  },
  Queues: {
    titleAt: 'top',
    boxes: QUEUE_CUBES,
    fillBoxes: QUEUE_CUBES.slice(0, -1),
  },
  Migration: {
    titleAt: 'top',
    boxes: [MIGRATION_SOURCE, MIGRATION_TARGET],
    fillBoxes: [MIGRATION_SOURCE, MIGRATION_TARGET],
    nudgeY: 13,
    rings: [
      { x: 0.5, y: 0.5, z: 0.5, radius: 1.5 },
      { x: 1.65, y: -0.65, z: 0.5, radius: 1.78, isDashed: true },
      { x: 2.8, y: -1.8, z: 0.5, radius: 1.5 },
    ],
  },
  Comparison: {
    titleAt: 'bottom',
    boxes: [COMPARISON_TALL, { ...cube(1.4, 0, 0, 0.9), h: 1.4 }],
    fillBoxes: [COMPARISON_TALL],
  },
  Rundowns: {
    titleAt: 'bottom',
    boxes: RUNDOWN_BARS,
    fillBoxes: RUNDOWN_BARS.slice(0, -1),
  },
  Troubleshooting: {
    titleAt: 'bottom',
    boxes: TROUBLESHOOTING_SLABS,
    fillBoxes: TROUBLESHOOTING_SLABS.slice(1, 2),
  },
  Tutorials: {
    titleAt: 'top',
    view: 'front',
    boxes: TUTORIAL_STEPS.flat(),
    fillBoxes: TUTORIAL_STEPS.flatMap((column) => column.slice(0, -1)),
  },
  Platform: {
    titleAt: 'top',
    boxes: PLATFORM_LAYERS,
    fillBoxes: PLATFORM_LAYERS.slice(1, 2),
    nudgeY: 13,
    zoom: 0.645,
  },
}

export const FALLBACK_COMPOSITION: IsoComposition = { titleAt: 'top', boxes: [cube(0, 0, 0, 1)] }
