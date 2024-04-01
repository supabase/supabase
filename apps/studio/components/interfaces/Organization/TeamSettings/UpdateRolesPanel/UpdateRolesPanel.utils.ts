export interface ProjectRoleConfiguration {
  projectId?: number
  roleId: number
}

export const deriveChanges = (
  original: ProjectRoleConfiguration[],
  final: ProjectRoleConfiguration[]
) => {
  const removed: ProjectRoleConfiguration[] = []
  const added: ProjectRoleConfiguration[] = []
  const updated: { projectId?: number; originalRole: number; updatedRole: number }[] = []

  original.forEach((x) => {
    const updatedRoleForProject = final.find((y) => x.projectId === y.projectId)
    if (updatedRoleForProject === undefined) {
      removed.push(x)
    } else if (updatedRoleForProject.roleId !== x.roleId) {
      updated.push({
        projectId: updatedRoleForProject.projectId,
        originalRole: x.roleId,
        updatedRole: updatedRoleForProject.roleId,
      })
    }
  })

  final.forEach((x) => {
    const newRoleForProject = original.find((y) => x.projectId === y.projectId)
    if (newRoleForProject === undefined) {
      added.push(x)
    }
  })

  return { removed, added, updated }
}
