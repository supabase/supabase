import { describe, expect, it } from 'vitest'

import { getEntityActions, type EntityAction, type EntityActionGroup } from './EntityActions.utils'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'

const flatten = (groups: EntityActionGroup[]): EntityAction[] =>
  groups.flat().flatMap((action) => [action, ...(action.children ?? [])])

const idsOf = (groups: EntityActionGroup[]) => flatten(groups).map((action) => action.id)

const getActions = (
  overrides: Partial<Parameters<typeof getEntityActions>[0]['entity']> = {},
  context: { isLocked?: boolean } = {}
) =>
  getEntityActions({
    entity: {
      id: 42,
      schema: 'public',
      type: ENTITY_TYPE.TABLE,
      is_partition: false,
      ...overrides,
    },
    projectRef: 'abc',
    isLocked: false,
    ...context,
  })

describe('getEntityActions', () => {
  it('offers every table action', () => {
    const groups = getActions()

    expect(idsOf(groups)).toEqual([
      'copy-name',
      'copy-schema',
      'edit-table',
      'duplicate-table',
      'view-policies',
      'export',
      'export-csv',
      'export-sql',
      'export-cli',
      'delete',
    ])
  })

  it('hides the actions that change the table in a locked schema', () => {
    const ids = idsOf(getActions({}, { isLocked: true }))

    expect(ids).not.toContain('edit-table')
    expect(ids).not.toContain('duplicate-table')
    expect(ids).not.toContain('delete')
    expect(ids).toEqual(expect.arrayContaining(['copy-name', 'view-policies', 'export-csv']))
  })

  it('scopes the policies link to the entity', () => {
    const policies = flatten(getActions({ id: 7, schema: 'my schema' })).find(
      (action) => action.id === 'view-policies'
    )

    expect(policies?.href).toBe('/project/abc/database/policies?schema=my%20schema&search=7')
  })

  it.each([
    ['view', ENTITY_TYPE.VIEW],
    ['materialized view', ENTITY_TYPE.MATERIALIZED_VIEW],
  ])('treats a %s as a view: definition copy, no CLI export or policies', (_name, type) => {
    const groups = getActions({ type })
    const actions = flatten(groups)

    expect(idsOf(groups)).toEqual([
      'copy-name',
      'copy-definition',
      'export',
      'export-csv',
      'export-sql',
      'delete',
    ])
    expect(actions.find((action) => action.id === 'export-csv')?.label).toBe('Export view as CSV')
    expect(actions.find((action) => action.id === 'delete')?.label).toBe('Delete view')
  })

  it('lets partitioned tables view partitions but not be edited or duplicated', () => {
    const ids = idsOf(getActions({ type: ENTITY_TYPE.PARTITIONED_TABLE }))

    expect(ids).toContain('view-partitions')
    expect(ids).toContain('delete')
    expect(ids).not.toContain('edit-table')
    expect(ids).not.toContain('duplicate-table')
  })

  it('does not offer editing or duplicating a child partition', () => {
    const ids = idsOf(getActions({ is_partition: true }))

    expect(ids).not.toContain('edit-table')
    expect(ids).not.toContain('duplicate-table')
    expect(ids).toContain('delete')
  })

  it('only offers copying the name for other entity types', () => {
    expect(idsOf(getActions({ type: ENTITY_TYPE.FOREIGN_TABLE }))).toEqual(['copy-name'])
  })
})
