import { describe, expect, it } from 'vitest'

import { buildRowLayout } from './flow-layout'

const config = { columnWidth: 100, columnGap: 40 }

describe('buildRowLayout', () => {
  it('returns an empty map for no nodes', () => {
    expect(buildRowLayout([], 0, config).size).toBe(0)
  })

  it('centers a single node on centerX', () => {
    const layout = buildRowLayout(['a'], 200, config)
    expect(layout.get('a')?.x).toBe(200)
  })

  it('symmetrically distributes two nodes around centerX', () => {
    const layout = buildRowLayout(['a', 'b'], 0, config)
    // total width = 100 + 40 + 100 = 240, half = 120
    // first center  = -120 + 50           = -70
    // second center =  -70 + 50 + 40 + 50 =  70
    expect(layout.get('a')?.x).toBe(-70)
    expect(layout.get('b')?.x).toBe(70)
  })

  it('honors columnGap between nodes', () => {
    const layout = buildRowLayout(['a', 'b'], 0, config)
    const positions = Array.from(layout.values()).map((p) => p.x)
    expect(positions[1] - positions[0]).toBe(config.columnWidth + config.columnGap)
  })

  it('sets width on each position from config', () => {
    const layout = buildRowLayout(['a'], 0, config)
    expect(layout.get('a')?.width).toBe(100)
  })
})
