import { describe, test, expect } from 'vitest'
import { deriveRoleChangeActions } from './UpdateRolesPanel.utils'

// [Joshen] This is specifically testing the project scope changes
describe('UpdateRolesPanel.utils.ts:deriveRoleChangeActions', () => {
  test('Should update from org scope to project scope correctly', () => {
    const existingRoles = [
      {
        id: 3,
        name: 'Developer',
        description: null,
        project_ids: null,
        base_role_id: 6,
      },
    ]
    const changesToRoles = {
      removed: [],
      added: [
        { projectId: 1, ref: 'ref_1', roleId: 3 },
        { projectId: 2, ref: 'ref_2', roleId: 3 },
        { projectId: 3, ref: 'ref_3', roleId: 3 },
      ],
      updated: [],
    }

    const { toAssign, toRemove, toUpdate } = deriveRoleChangeActions(existingRoles, changesToRoles)
    expect(toRemove).toStrictEqual([3])
    expect(toAssign).toStrictEqual([{ roleId: 3, projectIds: [1, 2, 3] }])
    expect(toUpdate).toStrictEqual([])
  })
  test('Should update role for a single project (Project 1, Developer to Admin)', () => {
    const existingRoles = [
      {
        id: 29,
        name: 'Developer_qggwcbikivagivlidfhw',
        description: '',
        project_ids: [1],
        base_role_id: 3,
      },
    ]
    const changesToRoles = {
      removed: [],
      added: [],
      updated: [
        {
          ref: 'ref_1',
          projectId: 1,
          originalRole: 29,
          originalBaseRole: 3,
          updatedRole: 1,
        },
      ],
    }

    const { toAssign, toRemove, toUpdate } = deriveRoleChangeActions(existingRoles, changesToRoles)
    expect(toRemove).toStrictEqual([29])
    expect(toAssign).toStrictEqual([{ roleId: 1, projectIds: [1] }])
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
        project_ids: [1, 2, 3],
        base_role_id: 3,
      },
    ]
    const changesToRoles = {
      removed: [
        {
          ref: 'ref_1',
          projectId: 1,
          roleId: 29,
          baseRoleId: 3,
        },
        {
          ref: 'ref_2',
          projectId: 2,
          roleId: 29,
          baseRoleId: 3,
        },
      ],
      added: [],
      updated: [
        {
          ref: 'ref_3',
          projectId: 3,
          originalRole: 29,
          originalBaseRole: 3,
          updatedRole: 1,
        },
      ],
    }

    const { toAssign, toRemove, toUpdate } = deriveRoleChangeActions(existingRoles, changesToRoles)
    expect(toRemove).toStrictEqual([29])
    expect(toAssign).toStrictEqual([{ roleId: 1, projectIds: [3] }])
    expect(toUpdate).toStrictEqual([])
  })
  test('Should not remove role if role changes partially involve either removing role or updating role to another', () => {
    const existingRoles = [
      {
        id: 29,
        name: 'Developer_qggwcbikivagivlidfhw',
        description: '',
        project_ids: [1, 2, 3],
        base_role_id: 3,
      },
    ]
    const changesToRoles = {
      removed: [
        {
          ref: 'ref_1',
          projectId: 1,
          roleId: 29,
          baseRoleId: 3,
        },
      ],
      added: [],
      updated: [
        {
          ref: 'ref_3',
          projectId: 3,
          originalRole: 29,
          originalBaseRole: 3,
          updatedRole: 1,
        },
      ],
    }

    const { toRemove, toUpdate } = deriveRoleChangeActions(existingRoles, changesToRoles)
    expect(toRemove).toStrictEqual([])
    expect(toUpdate).toStrictEqual([{ roleId: 29, projectIds: [2] }])
  })
  test('Should update role if newly added role(s) has the same base_role_id, and if removed role has same base_role_id', () => {
    const existingRoles = [
      {
        id: 29,
        name: 'Developer_qggwcbikivagivlidfhw',
        description: '',
        project_ids: [1, 2, 3],
        base_role_id: 3,
      },
    ]
    const changesToRoles = {
      removed: [
        {
          ref: 'ref_1',
          projectId: 1,
          roleId: 29,
          baseRoleId: 3,
        },
      ],
      added: [
        { projectId: 4, ref: 'ref_2', roleId: 3 },
        { projectId: 5, ref: 'ref_3', roleId: 3 },
      ],
      updated: [],
    }

    const { toAssign, toRemove, toUpdate } = deriveRoleChangeActions(existingRoles, changesToRoles)
    expect(toUpdate).toStrictEqual([{ roleId: 29, projectIds: [2, 3, 4, 5] }])
    expect(toAssign).toStrictEqual([])
    expect(toRemove).toStrictEqual([])
  })
  test('Should assign new role if newly added role(s) has the no base_role_id as any existing role', () => {
    const existingRoles = [
      {
        id: 29,
        name: 'Developer_qggwcbikivagivlidfhw',
        description: '',
        project_ids: [1, 2, 3],
        base_role_id: 3,
      },
    ]
    const changesToRoles = {
      removed: [],
      added: [
        { projectId: 4, ref: 'ref_2', roleId: 1 },
        { projectId: 5, ref: 'ref_3', roleId: 1 },
      ],
      updated: [],
    }

    const { toAssign, toRemove, toUpdate } = deriveRoleChangeActions(existingRoles, changesToRoles)
    expect(toAssign).toStrictEqual([{ roleId: 1, projectIds: [4, 5] }])
    expect(toUpdate).toStrictEqual([])
    expect(toRemove).toStrictEqual([])
  })
  test('Should assign project read only role from org developer role correctly', () => {
    const existingRoles = [
      {
        id: 3,
        name: 'Developer',
        description: null,
        project_ids: null,
        base_role_id: 6,
      },
    ]
    const changesToRoles = {
      removed: [{ projectId: undefined, ref: undefined, roleId: 3 }],
      added: [{ projectId: 1, ref: 'ref_1', roleId: 6 }],
      updated: [],
    }

    const { toAssign, toRemove, toUpdate } = deriveRoleChangeActions(existingRoles, changesToRoles)
    expect(toAssign).toStrictEqual([{ roleId: 6, projectIds: [1] }])
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
        project_ids: [1, 2, 3],
        base_role_id: 3, // Developer
      },
      {
        id: 31,
        name: 'Administrator_qggwcbikivagivlidfhw',
        description: '',
        project_ids: [4],
        base_role_id: 1, // Admin,
      },
      {
        id: 32,
        name: 'Owner_qggwcbikivagivlidfhw',
        description: '',
        project_ids: [5],
        base_role_id: 5, // Owner,
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
          projectId: 1,
          roleId: 30,
          baseRoleId: 3,
        },
      ],
      added: [{ projectId: 6, ref: 'ref_6', roleId: 1 }],
      updated: [
        {
          ref: 'ref_2',
          projectId: 2,
          originalRole: 30,
          originalBaseRole: 3,
          updatedRole: 1,
        },
        {
          ref: 'ref_3',
          projectId: 3,
          originalRole: 30,
          originalBaseRole: 3,
          updatedRole: 5,
        },
        {
          ref: 'ref_4',
          projectId: 4,
          originalRole: 31,
          originalBaseRole: 1,
          updatedRole: 5,
        },
      ],
    }

    const { toAssign, toRemove, toUpdate } = deriveRoleChangeActions(existingRoles, changesToRoles)
    expect(toAssign).toStrictEqual([])
    expect(toUpdate).toStrictEqual([
      { roleId: 31, projectIds: [2, 6] },
      { roleId: 32, projectIds: [3, 4, 5] },
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
        project_ids: [1],
        base_role_id: 3, // Developer
      },
      {
        id: 31,
        name: 'Administrator_qggwcbikivagivlidfhw',
        description: '',
        project_ids: [2],
        base_role_id: 1, // Admin,
      },
    ]

    // Adding developer for 4
    // Updating developer -> admin for 1
    // Updating admin -> developer for 2
    // Adding owner for 5
    const changesToRoles = {
      removed: [],
      added: [
        { projectId: 4, ref: 'ref_4', roleId: 3 },
        { projectId: 5, ref: 'ref_5', roleId: 5 },
      ],
      updated: [
        {
          ref: 'ref_1',
          projectId: 1,
          originalRole: 30,
          originalBaseRole: 3,
          updatedRole: 1,
        },
        {
          ref: 'ref_2',
          projectId: 2,
          originalRole: 31,
          originalBaseRole: 1,
          updatedRole: 3,
        },
      ],
    }

    const { toAssign, toRemove, toUpdate } = deriveRoleChangeActions(existingRoles, changesToRoles)
    expect(toAssign).toStrictEqual([{ roleId: 5, projectIds: [5] }])
    expect(toUpdate).toStrictEqual([
      { roleId: 30, projectIds: [2, 4] },
      { roleId: 31, projectIds: [1] },
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
        project_ids: [1, 2, 3],
        base_role_id: 3, // Developer
      },
      {
        id: 31,
        name: 'Administrator_qggwcbikivagivlidfhw',
        description: '',
        project_ids: [4, 5, 6],
        base_role_id: 1, // Admin,
      },
      {
        id: 32,
        name: 'Owner_qggwcbikivagivlidfhw',
        description: '',
        project_ids: [7],
        base_role_id: 5, // Owner
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
          projectId: 2,
          roleId: 30,
          baseRoleId: 3,
        },
        {
          ref: 'ref_7',
          projectId: 7,
          roleId: 32,
          baseRoleId: 5,
        },
      ],
      added: [
        { projectId: 8, ref: 'ref_8', roleId: 1 },
        { projectId: 9, ref: 'ref_9', roleId: 3 },
        { projectId: 10, ref: 'ref_10', roleId: 3 },
      ],
      updated: [
        {
          ref: 'ref_3',
          projectId: 3,
          originalRole: 30,
          originalBaseRole: 3,
          updatedRole: 5,
        },
        {
          ref: 'ref_5',
          projectId: 5,
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
      { roleId: 30, projectIds: [1, 9, 10] },
      { roleId: 31, projectIds: [4, 6, 8] },
      { roleId: 32, projectIds: [3, 5] },
    ])
  })
})
