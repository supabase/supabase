import { describe, it, expect } from 'vitest'
import {
  getContentFilePath,
  inferConnectTabFromParentKey,
} from 'components/interfaces/Connect/Connect.utils'
import { FRAMEWORKS } from 'components/interfaces/Connect/Connect.constants'

describe('Connect.utils helpers', () => {
  it('inferConnectTabFromParentKey returns frameworks for nextjs', () => {
    expect(inferConnectTabFromParentKey('nextjs')).toBe('frameworks')
  })

  it('inferConnectTabFromParentKey returns null for unknown', () => {
    expect(inferConnectTabFromParentKey('unknown-x')).toBeNull()
  })

  it('inferConnectTabFromParentKey returns mobiles for exporeactnative', () => {
    expect(inferConnectTabFromParentKey('exporeactnative')).toBe('mobiles')
  })

  it('inferConnectTabFromParentKey returns orms for prisma', () => {
    expect(inferConnectTabFromParentKey('prisma')).toBe('orms')
  })

  it('inferConnectTabFromParentKey returns null for null parentKey', () => {
    expect(inferConnectTabFromParentKey(null)).toBeNull()
  })

  describe('getContentFilePath', () => {
    it('returns parent/child/grandchild when all exist', () => {
      const path = getContentFilePath({
        connectionObject: FRAMEWORKS,
        selectedParent: 'nextjs',
        selectedChild: 'app',
        selectedGrandchild: 'supabasejs',
      })
      expect(path).toBe('nextjs/app/supabasejs')
    })

    it('returns parent/child when grandchild does not exist', () => {
      const path = getContentFilePath({
        connectionObject: FRAMEWORKS,
        selectedParent: 'remix',
        selectedChild: 'supabasejs',
        selectedGrandchild: 'does-not-exist',
      })
      expect(path).toBe('remix/supabasejs')
    })

    it('returns parent when child does not exist', () => {
      const path = getContentFilePath({
        connectionObject: FRAMEWORKS,
        selectedParent: 'nextjs',
        selectedChild: 'unknown-child',
        selectedGrandchild: 'any',
      })
      expect(path).toBe('nextjs')
    })

    it('returns empty string when parent does not exist', () => {
      const path = getContentFilePath({
        connectionObject: FRAMEWORKS,
        selectedParent: 'unknown-parent',
        selectedChild: 'any',
        selectedGrandchild: 'any',
      })
      expect(path).toBe('')
    })
  })
})
