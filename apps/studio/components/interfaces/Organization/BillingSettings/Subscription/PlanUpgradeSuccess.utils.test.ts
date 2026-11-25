import { describe, expect, it } from 'vitest'

import { getMicroUpgradeRows } from './PlanUpgradeSuccess.utils'
import { createMockOrgProject } from '@/tests/helpers'

describe('getMicroUpgradeRows', () => {
  const rowRefs = (rows: ReturnType<typeof getMicroUpgradeRows>) =>
    rows.map(({ project, isUpgrading }) => ({ ref: project.ref, isUpgrading }))

  it('lists running projects on Nano compute', () => {
    const projects = [
      createMockOrgProject({ ref: 'nano-active', computeSize: 'nano' }),
      createMockOrgProject({ ref: 'micro-active', computeSize: 'micro' }),
      createMockOrgProject({ ref: 'nano-paused', computeSize: 'nano', status: 'INACTIVE' }),
    ]

    expect(rowRefs(getMicroUpgradeRows(projects, new Set()))).toEqual([
      { ref: 'nano-active', isUpgrading: false },
    ])
  })

  it('keeps an upgraded project listed while it resizes, then drops it once it runs on Micro', () => {
    const requested = new Set(['upgraded'])
    const resizing = createMockOrgProject({
      ref: 'upgraded',
      computeSize: 'micro',
      status: 'RESIZING',
    })
    const done = createMockOrgProject({ ref: 'upgraded', computeSize: 'micro' })

    expect(rowRefs(getMicroUpgradeRows([resizing], requested))).toEqual([
      { ref: 'upgraded', isUpgrading: true },
    ])
    expect(getMicroUpgradeRows([done], requested)).toEqual([])
  })

  it('shows a resizing Nano project as upgrading, but not an unrelated resize on other compute', () => {
    const projects = [
      createMockOrgProject({ ref: 'nano-resizing', computeSize: 'nano', status: 'RESIZING' }),
      createMockOrgProject({ ref: 'small-resizing', computeSize: 'small', status: 'RESIZING' }),
    ]

    expect(rowRefs(getMicroUpgradeRows(projects, new Set()))).toEqual([
      { ref: 'nano-resizing', isUpgrading: true },
    ])
  })

  it('keeps a requested project upgrading when a stale response still reports it active on Nano', () => {
    const stale = createMockOrgProject({ ref: 'upgraded', computeSize: 'nano' })

    expect(rowRefs(getMicroUpgradeRows([stale], new Set(['upgraded'])))).toEqual([
      { ref: 'upgraded', isUpgrading: true },
    ])
  })
})
