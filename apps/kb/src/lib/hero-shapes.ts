import { cube, type IsoBox, type IsoRing } from './iso-shapes'
import type { Topic } from './topics'

const SHACKLE_LIFT = 2

const FAQ_BLOCKS: IsoBox[] = [
  cube(0, 0, 0, 1),
  cube(1.4, 0, 0, 1),
  cube(0, 1.4, 0, 1),
  cube(1.4, 1.4, 0, 1),
]

export const HERO_SHAPES: Record<Topic, IsoBox[]> = {
  Auth: [
    { x: 0, y: 0, z: 0, w: 0.8, d: 1.8, h: 1.3, inset: 'front' },
    { x: 0.3, y: 0.3, z: SHACKLE_LIFT, w: 0.2, d: 0.2, h: 0.8 },
    { x: 0.3, y: 1.3, z: SHACKLE_LIFT, w: 0.2, d: 0.2, h: 0.8 },
    { x: 0.3, y: 0.3, z: SHACKLE_LIFT + 0.8, w: 0.2, d: 1.2, h: 0.2 },
  ],
  Database: [0, 0.9, 1.8].map((z) => ({ x: 0, y: 0, z, w: 2, d: 2, h: 0.38, shape: 'cylinder' })),
  Realtime: [{ ...cube(0, 0, 0, 2), inset: 'front' }, cube(2.9, -0.9, 1.5, 0.7)],
  Storage: [{ ...cube(0, 0, 0, 1.1), h: 0.8, inset: 'top' }],
  'Edge Functions': [
    cube(0, 0, 0.3, 1.34),
    cube(3, 0.47, 0.9, 0.4),
    cube(0.47, 3, 0, 0.4),
    cube(-2.4, 0.47, 0.6, 0.4),
    cube(0.47, -2.4, 1.2, 0.4),
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
  Platform: [0, 1, 2].map((i) => ({ x: 0, y: 0, z: i * 0.9, w: 2.2, d: 2.2, h: 0.18 })),
  FAQs: FAQ_BLOCKS,
}

// a share of the shape's long side added on each edge, so a lone shape does not fill the flank.
// storage's sides then sit on the grid columns
export const HERO_PADDING: Partial<Record<Topic, number>> = {
  Storage: 1 / 6,
}

export const HERO_RINGS: Partial<Record<Topic, IsoRing[]>> = {
  Migration: [
    { x: 0.5, y: 0.5, z: 0.5, radius: 1.5 },
    { x: 1.65, y: -0.65, z: 1.1, radius: 1.85, isDashed: true },
    { x: 2.8, y: -1.8, z: 1.7, radius: 1.5 },
  ],
}
