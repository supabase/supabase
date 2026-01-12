import { describe, expect, test } from 'vitest'
import { deriveRoleChangeActions } from './UpdateRolesPanel.utils'

// [Joshen] This is specifically testing the project scope changes
describe('UpdateRolesPanel.utils.ts:deriveRoleChangeActions', () => {
  test('Should update from org scope to project scope correctly', () => {
    const existingRoles = [
      {
        id: 3,
        name: 'Developer',
        description: null,
        projects: [],
        base_role_id: 6,
      },
    ]
    const changesToRoles = {
      removed: [],
      added: [
        { ref: 'ref_1', roleId: 3 },
        { ref: 'ref_2', roleId: 3 },
        { ref: 'ref_3', roleId: 3 },
      ],
      updated: [],
    }

    const { toAssign, toRemove, toUpdate } = deriveRoleChangeActions(existingRoles, changesToRoles)
    expect(toRemove).toStrictEqual([3])
    expect(toAssign).toStrictEqual([{ roleId: 3, refs: ['ref_1', 'ref_2', 'ref_3'] }])
    expect(toUpdate).toStrictEqual([])
  })
  test('Should update role for a single project (Project 1, Developer to Admin)', () => {
    const existingRoles = [
      {
        id: 29,
        name: 'Developer_qggwcbikivagivlidfhw',
        description: '',
        projects: [{ ref: 'ref_1', name: 'Project 1' }],
        base_role_id: 3,
      },
    ]
    const changesToRoles = {
      removed: [],
      added: [],
      updated: [
        {
          ref: 'ref_1',
          originalRole: 29,
          originalBaseRole: 3,
          updatedRole: 1,
        },
      ],
    }

    const { toAssign, toRemove, toUpdate } = deriveRoleChangeActions(existingRoles, changesToRoles)
    expect(toRemove).toStrictEqual([29])
    expect(toAssign).toStrictEqual([{ roleId: 1, refs: ['ref_1'] }])
    expect(toUpdate).toStrictEqual([])
  })
  test('Should remove role if role changes completely involve either removing role or updating role to another', () => {
    // Developer of projects 1, 2, 3
    // Remove developer role for projects 1, 2
    // Update developer to admin for project 3
    const existingRoles = [
      {
        id: 29,
        name: 'Developer_qggwcbikivagivlidfhw',
        description: '',
        base_role_id: 3,
        projects: [
          { ref: 'ref_1', name: 'Project 1' },
          { ref: 'ref_2', name: 'Project 2' },
          { ref: 'ref_3', name: 'Project 3' },
        ],
      },
    ]
    const changesToRoles = {
      removed: [
        {
          ref: 'ref_1',
          roleId: 29,
          baseRoleId: 3,
        },
        {
          ref: 'ref_2',
          roleId: 29,
          baseRoleId: 3,
        },
      ],
      added: [],
      updated: [
        {
          ref: 'ref_3',
          originalRole: 29,
          originalBaseRole: 3,
          updatedRole: 1,
        },
      ],
    }

    const { toAssign, toRemove, toUpdate } = deriveRoleChangeActions(existingRoles, changesToRoles)
    expect(toRemove).toStrictEqual([29])
    expect(toAssign).toStrictEqual([{ roleId: 1, refs: ['ref_3'] }])
    expect(toUpdate).toStrictEqual([])
  })
  test('Should not remove role if role changes partially involve either removing role or updating role to another', () => {
    const existingRoles = [
      {
        id: 29,
        name: 'Developer_qggwcbikivagivlidfhw',
        description: '',
        base_role_id: 3,
        projects: [
          { ref: 'ref_1', name: 'Project 1' },
          { ref: 'ref_2', name: 'Project 2' },
          { ref: 'ref_3', name: 'Project 3' },
        ],
      },
    ]
    const changesToRoles = {
      removed: [
        {
          ref: 'ref_1',
          roleId: 29,
          baseRoleId: 3,
        },
      ],
      added: [],
      updated: [
        {
          ref: 'ref_3',
          originalRole: 29,
          originalBaseRole: 3,
          updatedRole: 1,
        },
      ],
    }

    const { toRemove, toUpdate } = deriveRoleChangeActions(existingRoles, changesToRoles)
    expect(toRemove).toStrictEqual([])
    expect(toUpdate).toStrictEqual([{ roleId: 29, refs: ['ref_2'] }])
  })
  test('Should update role if newly added role(s) has the same base_role_id, and if removed role has same base_role_id', () => {
    const existingRoles = [
      {
        id: 29,
        name: 'Developer_qggwcbikivagivlidfhw',
        description: '',
        base_role_id: 3,
        projects: [
          { ref: 'ref_1', name: 'Project 1' },
          { ref: 'ref_2', name: 'Project 2' },
          { ref: 'ref_3', name: 'Project 3' },
        ],
      },
    ]
    const changesToRoles = {
      removed: [
        {
          ref: 'ref_1',
          roleId: 29,
          baseRoleId: 3,
        },
      ],
      added: [
        { ref: 'ref_4', roleId: 3 },
        { ref: 'ref_5', roleId: 3 },
      ],
      updated: [],
    }

    const { toAssign, toRemove, toUpdate } = deriveRoleChangeActions(existingRoles, changesToRoles)
    expect(toUpdate).toStrictEqual([{ roleId: 29, refs: ['ref_2', 'ref_3', 'ref_4', 'ref_5'] }])
    expect(toAssign).toStrictEqual([])
    expect(toRemove).toStrictEqual([])
  })
  test('Should assign new role if newly added role(s) has no base_role_id as any existing role', () => {
    const existingRoles = [
      {
        id: 29,
        name: 'Developer_qggwcbikivagivlidfhw',
        description: '',
        base_role_id: 3,
        projects: [
          { ref: 'ref_1', name: 'Project 1' },
          { ref: 'ref_2', name: 'Project 2' },
          { ref: 'ref_3', name: 'Project 3' },
        ],
      },
    ]
    const changesToRoles = {
      removed: [],
      added: [
        { ref: 'ref_4', roleId: 1 },
        { ref: 'ref_5', roleId: 1 },
      ],
      updated: [],
    }

    const { toAssign, toRemove, toUpdate } = deriveRoleChangeActions(existingRoles, changesToRoles)
    expect(toAssign).toStrictEqual([{ roleId: 1, refs: ['ref_4', 'ref_5'] }])
    expect(toUpdate).toStrictEqual([])
    expect(toRemove).toStrictEqual([])
  })
  test('Should assign project read only role from org developer role correctly', () => {
    const existingRoles = [
      {
        id: 3,
        name: 'Developer',
        description: null,
        base_role_id: 6,
        projects: [],
      },
    ]
    const changesToRoles = {
      removed: [{ ref: undefined, roleId: 3 }],
      added: [{ ref: 'ref_1', roleId: 6 }],
      updated: [],
    }

    const { toAssign, toRemove, toUpdate } = deriveRoleChangeActions(existingRoles, changesToRoles)
    expect(toAssign).toStrictEqual([{ roleId: 6, refs: ['ref_1'] }])
    expect(toUpdate).toStrictEqual([])
    expect(toRemove).toStrictEqual([3])
  })
  test('Myriad of updates to stress test function logic (I)', () => {
    // Given 6 projects 1, 2, 3, 4, 5, 6
    // Existing has developer role for 1, 2, 3, admin role for 4, owner role for 5
    const existingRoles = [
      {
        id: 30,
        name: 'Developer_qggwcbikivagivlidfhw',
        description: '',
        base_role_id: 3, // Developer
        projects: [
          { ref: 'ref_1', name: 'Project 1' },
          { ref: 'ref_2', name: 'Project 2' },
          { ref: 'ref_3', name: 'Project 3' },
        ],
      },
      {
        id: 31,
        name: 'Administrator_qggwcbikivagivlidfhw',
        description: '',
        base_role_id: 1, // Admin,
        projects: [{ ref: 'ref_4', name: 'Project 4' }],
      },
      {
        id: 32,
        name: 'Owner_qggwcbikivagivlidfhw',
        description: '',
        base_role_id: 5, // Owner,
        projects: [{ ref: 'ref_5', name: 'Project 5' }],
      },
    ]

    // Removing developer for 1
    // Updating developer -> admin for 2
    // Updating developer -> owner for 3
    // Updating administrator -> owner for 4
    // Adding administrator for 6
    const changesToRoles = {
      removed: [
        {
          ref: 'ref_1',
          roleId: 30,
          baseRoleId: 3,
        },
      ],
      added: [{ ref: 'ref_6', roleId: 1 }],
      updated: [
        {
          ref: 'ref_2',
          originalRole: 30,
          originalBaseRole: 3,
          updatedRole: 1,
        },
        {
          ref: 'ref_3',
          originalRole: 30,
          originalBaseRole: 3,
          updatedRole: 5,
        },
        {
          ref: 'ref_4',
          originalRole: 31,
          originalBaseRole: 1,
          updatedRole: 5,
        },
      ],
    }

    const { toAssign, toRemove, toUpdate } = deriveRoleChangeActions(existingRoles, changesToRoles)
    expect(toAssign).toStrictEqual([])
    expect(toUpdate).toStrictEqual([
      { roleId: 31, refs: ['ref_2', 'ref_6'] },
      { roleId: 32, refs: ['ref_3', 'ref_4', 'ref_5'] },
    ])
    expect(toRemove).toStrictEqual([30])
  })
  test('Myriad of updates to stress test function logic (II)', () => {
    // Given 5 projects 1, 2, 3, 4, 5
    // Existing has developer role for 1, admin role for 2
    const existingRoles = [
      {
        id: 30,
        name: 'Developer_qggwcbikivagivlidfhw',
        description: '',
        base_role_id: 3, // Developer
        projects: [{ ref: 'ref_1', name: 'Project 1' }],
      },
      {
        id: 31,
        name: 'Administrator_qggwcbikivagivlidfhw',
        description: '',
        base_role_id: 1, // Admin,
        projects: [{ ref: 'ref_2', name: 'Project 2' }],
      },
    ]

    // Adding developer for 4
    // Updating developer -> admin for 1
    // Updating admin -> developer for 2
    // Adding owner for 5
    const changesToRoles = {
      removed: [],
      added: [
        { ref: 'ref_4', roleId: 3 },
        { ref: 'ref_5', roleId: 5 },
      ],
      updated: [
        {
          ref: 'ref_1',
          originalRole: 30,
          originalBaseRole: 3,
          updatedRole: 1,
        },
        {
          ref: 'ref_2',
          originalRole: 31,
          originalBaseRole: 1,
          updatedRole: 3,
        },
      ],
    }

    const { toAssign, toRemove, toUpdate } = deriveRoleChangeActions(existingRoles, changesToRoles)
    expect(toAssign).toStrictEqual([{ roleId: 5, refs: ['ref_5'] }])
    expect(toUpdate).toStrictEqual([
      { roleId: 30, refs: ['ref_2', 'ref_4'] },
      { roleId: 31, refs: ['ref_1'] },
    ])
    expect(toRemove).toStrictEqual([])
  })
  test('Myriad of updates to stress test function logic (III)', () => {
    // Given 10 projects 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    // Existing has developer role for 1, 2, 3, admin role for 4, 5, 6, owner for 7
    const existingRoles = [
      {
        id: 30,
        name: 'Developer_qggwcbikivagivlidfhw',
        description: '',
        base_role_id: 3, // Developer
        projects: [
          { ref: 'ref_1', name: 'Project 1' },
          { ref: 'ref_2', name: 'Project 2' },
          { ref: 'ref_3', name: 'Project 3' },
        ],
      },
      {
        id: 31,
        name: 'Administrator_qggwcbikivagivlidfhw',
        description: '',
        base_role_id: 1, // Admin,
        projects: [
          { ref: 'ref_4', name: 'Project 4' },
          { ref: 'ref_5', name: 'Project 5' },
          { ref: 'ref_6', name: 'Project 6' },
        ],
      },
      {
        id: 32,
        name: 'Owner_qggwcbikivagivlidfhw',
        description: '',
        base_role_id: 5, // Owner
        projects: [{ ref: 'ref_7', name: 'Project 7' }],
      },
    ]

    // Remove access from projects 2, 7
    // Update developer -> owner for project 3
    // Update admin -> owner for project 5
    // Add admin for project 8
    // Add developer for project 9 and 10
    const changesToRoles = {
      removed: [
        {
          ref: 'ref_2',
          roleId: 30,
          baseRoleId: 3,
        },
        {
          ref: 'ref_7',
          roleId: 32,
          baseRoleId: 5,
        },
      ],
      added: [
        { ref: 'ref_8', roleId: 1 },
        { ref: 'ref_9', roleId: 3 },
        { ref: 'ref_10', roleId: 3 },
      ],
      updated: [
        {
          ref: 'ref_3',
          originalRole: 30,
          originalBaseRole: 3,
          updatedRole: 5,
        },
        {
          ref: 'ref_5',
          originalRole: 31,
          originalBaseRole: 1,
          updatedRole: 5,
        },
      ],
    }

    const { toAssign, toRemove, toUpdate } = deriveRoleChangeActions(existingRoles, changesToRoles)
    expect(toAssign).toStrictEqual([])
    expect(toRemove).toStrictEqual([])
    expect(toUpdate).toStrictEqual([
      { roleId: 30, refs: ['ref_1', 'ref_10', 'ref_9'] },
      { roleId: 31, refs: ['ref_4', 'ref_6', 'ref_8'] },
      { roleId: 32, refs: ['ref_3', 'ref_5'] },
    ])
  })
})
