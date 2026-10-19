import { describe, expect, it } from 'vitest'

import {
  getNextProjectListSortForColumn,
  getProjectListAriaSort,
  toTableHeadSortValue,
  type ProjectListSort,
} from '@/components/interfaces/Home/ProjectList/ProjectListSort.utils'

describe('toTableHeadSortValue', () => {
  it.each([
    ['name_asc', 'name:asc'],
    ['name_desc', 'name:desc'],
    ['created_asc', 'created:asc'],
    ['created_desc', 'created:desc'],
  ] as const)('converts %s to %s', (sort, expected) => {
    expect(toTableHeadSortValue(sort)).toBe(expected)
  })
})

describe('getNextProjectListSortForColumn', () => {
  it('flips ascending to descending on the same column', () => {
    expect(getNextProjectListSortForColumn('name_asc')).toBe('name_desc')
    expect(getNextProjectListSortForColumn('created_asc')).toBe('created_desc')
  })

  it('flips descending to ascending on the same column', () => {
    expect(getNextProjectListSortForColumn('name_desc')).toBe('name_asc')
    expect(getNextProjectListSortForColumn('created_desc')).toBe('created_asc')
  })

  it('falls back to name ascending for an unrecognized sort', () => {
    expect(getNextProjectListSortForColumn('bogus' as ProjectListSort)).toBe('name_asc')
  })
})

describe('getProjectListAriaSort', () => {
  it('maps ascending sorts to "ascending"', () => {
    expect(getProjectListAriaSort('name_asc')).toBe('ascending')
    expect(getProjectListAriaSort('created_asc')).toBe('ascending')
  })

  it('maps descending sorts to "descending"', () => {
    expect(getProjectListAriaSort('name_desc')).toBe('descending')
    expect(getProjectListAriaSort('created_desc')).toBe('descending')
  })

  it('maps an unrecognized sort to "none"', () => {
    expect(getProjectListAriaSort('bogus' as ProjectListSort)).toBe('none')
  })
})
