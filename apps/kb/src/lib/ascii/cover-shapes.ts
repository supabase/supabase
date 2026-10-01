import type { Topic } from '../topics'
import { createRng, latticeSize, type Lattice } from './field'

interface ShapeGrid {
  cols: number
  rows: number
  put: (c: number, r: number, density: number) => void
}

interface Stage extends ShapeGrid {
  rand: () => number
  cellWidth: number
  cellHeight: number
  at: (u: number, v: number) => [number, number]
  line: (from: [number, number], to: [number, number], density: number) => void
}

type Shape = (stage: Stage) => void

interface CoverFieldParams {
  lattice: Lattice
  seed: number
  mask: Uint8Array
  topic: Topic | null
}

const STAGE = { left: 0.06, right: 0.8, top: 0.04, bottom: 0.62 }
const DROPOUT = 0.08
const SCATTER_CHANCE = 0.06
const SCATTER_DENSITY = 0.12

const FORMAT_TOPICS: Topic[] = ['Migration', 'Comparison', 'Troubleshooting', 'Tutorial']

const ramp = (from: number, to: number, t: number) => from + (to - from) * t

const firstBlockedRow = (mask: Uint8Array, cols: number, rows: number) => {
  for (let r = 0; r < rows; r++) {
    const blocked = mask.subarray(r * cols, (r + 1) * cols).reduce((sum, cell) => sum + cell, 0)
    if (blocked > cols / 2) return r - 1
  }
  return rows
}

const policyWall: Shape = ({ at, line, put, rand }) => {
  const [wallC, wallTop] = at(0.56, 0)
  const [, wallBottom] = at(0, 1)
  for (let r = wallTop; r <= wallBottom; r++) {
    put(wallC, r, 1)
    put(wallC + 1, r, 1)
  }
  const [startC] = at(0, 0)
  const [endC] = at(1, 0)
  for (let r = wallTop + 1, k = 0; r <= wallBottom; r += 2, k++) {
    for (let c = startC; c < wallC; c++)
      put(c, r, ramp(0.25, 0.75, (c - startC) / (wallC - startC)))
    if (k % 3 === 1 || rand() < 0.15) line([wallC + 2, r], [endC - 1, r], 0.75)
    if (k % 3 === 1) put(endC, r, 1)
  }
}

const bTree: Shape = ({ at, line, put }) => {
  const block = ([c, r]: [number, number]) => {
    put(c, r, 1)
    put(c + 1, r, 1)
    put(c, r + 1, 1)
    put(c + 1, r + 1, 1)
  }
  const root = at(0.5, 0)
  const mids = [at(0.2, 0.32), at(0.5, 0.32), at(0.8, 0.32)]
  block(root)
  for (const mid of mids) {
    block(mid)
    line([root[0], root[1] + 2], [mid[0], mid[1] - 1], 0.6)
  }
  const leafRow = at(0, 0.72)[1]
  mids.forEach((mid, m) => {
    for (const offset of [-0.1, 0, 0.1]) {
      const [leafC] = at(0.2 + m * 0.3 + offset, 0)
      line([mid[0], mid[1] + 2], [leafC, leafRow - 1], 0.45)
      put(leafC, leafRow, 1)
      put(leafC, leafRow + 1, 0.25)
    }
  })
  const [listStart, listRow] = at(0, 0.95)
  const [listEnd] = at(1, 0)
  line([listStart, listRow], [listEnd, listRow], 0.5)
  put(listEnd + 1, listRow, 1)
}

const rings: Shape = ({ at, put, cols, rows, rand, cellWidth, cellHeight }) => {
  const [cx, cy] = at(0.5, 0.5)
  const spacing = Math.max(cellWidth, cellHeight) * 1.2
  const thickness = Math.max(cellWidth, cellHeight) * 0.55
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const distance = Math.hypot((c - cx) * cellWidth, (r - cy) * cellHeight)
      for (let k = 0; k < 7; k++) {
        if (Math.abs(distance - (k + 1) * spacing) < thickness) put(c, r, 1 - k * 0.12)
      }
    }
  }
  put(cx, cy, 1)
  for (let i = 0; i < 4; i++) {
    const angle = rand() * Math.PI * 2
    const radius = (2 + Math.floor(rand() * 5)) * spacing
    put(
      Math.round(cx + (radius * Math.cos(angle)) / cellWidth),
      Math.round(cy + (radius * Math.sin(angle)) / cellHeight),
      1
    )
  }
}

const tableToTable: Shape = ({ at, line, put }) => {
  const grid = (u0: number, u1: number, density: number) => {
    const [c0, r0] = at(u0, 0.1)
    const [c1, r1] = at(u1, 0.9)
    for (let r = r0; r <= r1; r += 2) for (let c = c0; c <= c1; c++) put(c, r, density)
  }
  grid(0, 0.24, 0.75)
  grid(0.76, 1, 1)
  for (const v of [0.1, 0.42, 0.74]) {
    const [from, row] = at(0.27, v)
    const [to] = at(0.72, v)
    line([from, row], [to, row], 0.3)
    put(to, row, 0.9)
  }
}

const stackedBuckets: Shape = ({ at, line }) => {
  for (let i = 0; i < 3; i++) {
    const [c0, r0] = at(0.1 + i * 0.16, 0.05 + i * 0.12)
    const [c1, r1] = at(0.55 + i * 0.16, 0.6 + i * 0.12)
    const density = ramp(0.4, 1, i / 2)
    line([c0, r0], [c1, r0], density)
    line([c0, r0], [c0, r1], density)
    line([c1, r0], [c1, r1], density)
    line([c0, r1], [c1, r1], density)
  }
}

const linkedNodes: Shape = ({ at, line, put, rand }) => {
  const center = at(0.5, 0.5)
  for (let i = 0; i < 9; i++) {
    const angle = (i / 9) * Math.PI * 2 + rand() * 0.4
    const node = at(0.5 + Math.cos(angle) * 0.45, 0.5 + Math.sin(angle) * 0.45)
    line(center, node, 0.3)
    put(node[0], node[1], 1)
    put(node[0] + 1, node[1], 0.8)
  }
  put(center[0], center[1], 1)
  put(center[0] + 1, center[1], 1)
}

const conveyor: Shape = ({ at, line, put }) => {
  const [startC, row] = at(0, 0.5)
  const [endC] = at(1, 0)
  line([startC, row + 2], [endC, row + 2], 0.25)
  for (let c = startC, k = 0; c < endC - 2; c += 4, k++) {
    const density = ramp(1, 0.25, k / 10)
    for (let dc = 0; dc < 2; dc++) for (let dr = 0; dr < 2; dr++) put(c + dc, row + dr - 1, density)
  }
  put(endC, row + 2, 1)
}

const staircase: Shape = ({ at, put }) => {
  for (let step = 0; step < 6; step++) {
    const [c0, r0] = at(step / 6, 1 - (step + 1) / 6)
    const [c1, r1] = at((step + 1) / 6, 1)
    for (let c = c0; c < c1; c++) put(c, r0, 1)
    for (let r = r0; r <= r1; r += 2)
      for (let c = c0; c < c1; c += 2) put(c, r, ramp(0.25, 0.6, step / 5))
  }
}

const brokenPath: Shape = ({ at, line, put }) => {
  const points: [number, number][] = [
    [0, 0.8],
    [0.2, 0.3],
    [0.38, 0.7],
    [0.5, 0.45],
  ]
  for (let i = 0; i < points.length - 1; i++) line(at(...points[i]), at(...points[i + 1]), 0.75)
  line(at(0.62, 0.35), at(0.8, 0.75), 0.45)
  line(at(0.8, 0.75), at(1, 0.15), 0.45)
  const [mc, mr] = at(0.56, 0.42)
  for (let d = -1; d <= 1; d++) {
    put(mc + d, mr + d, 1)
    put(mc + d, mr - d, 1)
  }
}

const pairedColumns: Shape = ({ at, put }) => {
  const heights = [0.55, 0.8, 0.35, 0.95, 0.6, 0.75]
  heights.forEach((height, i) => {
    const [c] = at(0.04 + i * 0.17, 0)
    const [, bottom] = at(0, 1)
    const [, top] = at(0, 1 - height)
    const [, pairTop] = at(0, 1 - height * 0.7)
    for (let r = top; r <= bottom; r++) put(c, r, 1)
    for (let r = pairTop; r <= bottom; r++) put(c + 2, r, 0.35)
  })
}

const stackedLayers: Shape = ({ at, line }) => {
  for (let i = 0; i < 4; i++) {
    const v = 0.12 + i * 0.26
    const skew = 0.08
    const density = ramp(1, 0.35, i / 3)
    line(at(skew, v - 0.12), at(1, v - 0.12), density)
    line(at(0, v), at(1 - skew, v), density)
    line(at(skew, v - 0.12), at(0, v), density)
    line(at(1, v - 0.12), at(1 - skew, v), density)
  }
}

const hatch: Shape = ({ cols, rows, put }) => {
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) if ((c + r) % 6 === 0) put(c, r, 0.4)
}

export const pickCoverTopic = (topics: Topic[]): Topic | null =>
  topics.find((topic) => !FORMAT_TOPICS.includes(topic)) ?? topics[0] ?? null

export const coverField = ({ lattice, seed, mask, topic }: CoverFieldParams): Float32Array => {
  const { cols, rows } = latticeSize(lattice)
  const field = new Float32Array(cols * rows)
  if (cols === 0 || rows === 0) return field

  const rand = createRng(seed)
  const put = (c: number, r: number, density: number) => {
    const col = Math.round(c)
    const row = Math.round(r)
    if (col < 0 || row < 0 || col >= cols || row >= rows) return
    field[row * cols + col] = Math.max(field[row * cols + col], density)
  }
  const stageLeft = STAGE.left * cols
  const stageTop = STAGE.top * rows
  const stageWidth = (STAGE.right - STAGE.left) * cols
  const stageHeight = Math.max(
    1,
    Math.min(STAGE.bottom * rows, firstBlockedRow(mask, cols, rows)) - stageTop
  )
  const at = (u: number, v: number): [number, number] => [
    Math.round(stageLeft + u * stageWidth),
    Math.round(stageTop + v * stageHeight),
  ]
  const line = ([c0, r0]: [number, number], [c1, r1]: [number, number], density: number) => {
    const steps = Math.max(Math.abs(c1 - c0), Math.abs(r1 - r0), 1)
    for (let i = 0; i <= steps; i++) put(ramp(c0, c1, i / steps), ramp(r0, r1, i / steps), density)
  }

  const shape = topic ? COVER_SHAPES[topic] : FALLBACK_SHAPE
  const cellWidth = (lattice.xs[cols] - lattice.xs[0]) / cols
  const cellHeight = (lattice.ys[rows] - lattice.ys[0]) / rows
  shape({ cols, rows, put, rand, at, line, cellWidth, cellHeight })

  for (let i = 0; i < field.length; i++) {
    if (mask[i]) field[i] = 0
    else if (field[i] > 0 && rand() < DROPOUT) field[i] = 0
    else if (field[i] === 0 && rand() < SCATTER_CHANCE) field[i] = SCATTER_DENSITY
  }
  return field
}

export const COVER_SHAPES: Record<Topic, Shape> = {
  Migration: tableToTable,
  Comparison: pairedColumns,
  Troubleshooting: brokenPath,
  Tutorial: staircase,
  Storage: stackedBuckets,
  Auth: policyWall,
  Database: bTree,
  'Edge Functions': linkedNodes,
  Queues: conveyor,
  Realtime: rings,
  'Supabase Platform': stackedLayers,
}

const FALLBACK_SHAPE = hatch
