export interface ProjectRoleConfiguration {
  ref?: string
  roleId: number
}

export const deriveChanges = (
  original: ProjectRoleConfiguration[],
  final: ProjectRoleConfiguration[]
) => {
  const removed: ProjectRoleConfiguration[] = []
  const added: ProjectRoleConfiguration[] = []
  const updated: { ref?: string; originalRole: number; updatedRole: number }[] = []

  original.forEach((x) => {
    const updatedRoleForProject = final.find((y) => x.ref === y.ref)
    if (updatedRoleForProject === undefined) {
      removed.push(x)
    } else if (updatedRoleForProject.roleId !== x.roleId) {
      updated.push({
        ref: updatedRoleForProject.ref,
        originalRole: x.roleId,
        updatedRole: updatedRoleForProject.roleId,
      })
    }
  })

  final.forEach((x) => {
    const newRoleForProject = original.find((y) => x.ref === y.ref)
    if (newRoleForProject === undefined) {
      added.push(x)
    }
  })

  return { removed, added, updated }
}
