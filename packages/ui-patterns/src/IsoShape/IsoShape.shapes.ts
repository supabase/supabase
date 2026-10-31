import { cube, type IsoBox, type IsoRing } from './IsoShape.geometry'

type IsoPose = (activation: number) => IsoBox[]

const SHACKLE_LIFT = 2

export const ISO_SHAPES = {
  Auth: [
    { x: 0, y: 0, z: 0, w: 0.8, d: 1.8, h: 1.3, inset: 'front' },
    { x: 0.3, y: 0.3, z: SHACKLE_LIFT, w: 0.2, d: 0.2, h: 0.8 },
    { x: 0.3, y: 1.3, z: SHACKLE_LIFT, w: 0.2, d: 0.2, h: 0.8 },
    { x: 0.3, y: 0.3, z: SHACKLE_LIFT + 0.8, w: 0.2, d: 1.2, h: 0.2 },
  ],
  Database: [0, 0.9, 1.8].map((z) => ({ x: 0, y: 0, z, w: 2, d: 2, h: 0.38, shape: 'cylinder' })),
  Realtime: [{ ...cube(0, 0, 0, 2), inset: 'front' }, cube(2.9, -0.9, 1.5, 0.7)],
  Storage: [{ ...cube(0, 0, 0, 1.1), h: 0.8, inset: 'top' }],
  // box 2 is the piece, boxes 0-1 are the platform
  'Edge Functions': [
    { x: 0, y: 0, z: 0, w: 3, d: 2, h: 0.15 },
    { x: 0, y: 2, z: 0, w: 2, d: 1, h: 0.15 },
    { x: 2, y: 2, z: 0, w: 1, d: 1, h: 0.15, fillFace: 'top' },
  ],
  Queues: [0, 1, 2, 3].map((i) => cube(i * 1.35, 0, 0, 0.8)),
  Migration: [cube(0, 0, 0, 1), cube(2.3, -2.3, 1.2, 1)],
  Comparison: [
    { ...cube(0, 0, 0, 0.9), h: 2.4 },
    { ...cube(1.8, 0, 0, 0.9), h: 1.4 },
  ],
  Rundowns: [1.6, 2.2, 1, 1.8].map((h, i) => ({ ...cube(i * 1.3, 0, 0, 0.8), h })),
  Troubleshooting: [
    { ...cube(-0.1, 0.1, 0, 1), h: 0.7 },
    { ...cube(0.45, -0.35, 0.94, 1.105), h: 0.7 },
    { ...cube(-0.1, 0.1, 1.88, 1), h: 0.7 },
  ],
  Tutorials: [0, 1, 2].map((i) => ({ ...cube(0, -i * 1.4, i * 0.85, 1.1), h: 0.6 })),
  Platform: [0, 1, 2].map((i) => ({
    x: 0,
    y: 0,
    z: i * 0.9,
    w: 2.2,
    d: 2.2,
    h: 0.18,
    fillFace: 'top',
  })),
  FAQs: [cube(0, 0, 0, 1), cube(1.4, 0, 0, 1), cube(0, 1.4, 0, 1), cube(1.4, 1.4, 0, 1)],
} satisfies Record<string, IsoBox[]>

export type IsoShapeName = keyof typeof ISO_SHAPES

// a share of the shape's long side added on each edge, so a lone shape does not fill the flank.
// storage's sides then sit on the grid columns
export const ISO_SHAPE_PADDING: Partial<Record<IsoShapeName, number>> = {
  Storage: 1 / 6,
}

export const ISO_SHAPE_RINGS: Partial<Record<IsoShapeName, IsoRing[]>> = {
  Migration: [
    { x: 0.5, y: 0.5, z: 0.5, radius: 1.5 },
    { x: 1.65, y: -0.65, z: 1.1, radius: 1.85, isDashed: true },
    { x: 2.8, y: -1.8, z: 1.7, radius: 1.5 },
  ],
}

// how a shape moves while active. each pose returns the resting shape at 0
export const ISO_SHAPE_POSES: Partial<Record<IsoShapeName, IsoPose>> = {
  Auth: (t) =>
    ISO_SHAPES.Auth.map((box, i) =>
      i === 0 ? box : { ...box, z: box.z - (SHACKLE_LIFT - 1.3) * t }
    ),
  Database: (t) => ISO_SHAPES.Database.map((box, i) => ({ ...box, z: box.z + i * 0.35 * t })),
  'Edge Functions': (t) =>
    ISO_SHAPES['Edge Functions'].map((box, i) => (i === 2 ? { ...box, z: box.z + 0.6 * t } : box)),
}

// boxes that hold still while the rest of the shape orbits around them
export const ISO_SHAPE_STILL_BOXES: Partial<Record<IsoShapeName, number[]>> = {
  Realtime: [0],
}

// boxes that fill with glyphs when active, as on kb covers. other shapes fill their recesses
export const ISO_SHAPE_FILL_BOXES: Partial<Record<IsoShapeName, number[]>> = {
  Database: [0, 1],
  Platform: [0, 1],
  'Edge Functions': [2],
}

// shapes that swing back and forth by this many radians, not a full turn
export const ISO_SHAPE_SWINGS: Partial<Record<IsoShapeName, number>> = {
  // a full turn moves the small cube too far out, so the shape swings
  Realtime: Math.PI / 4,
  // 0 stops the turn, so the piece only rises and falls
  'Edge Functions': 0,
}
