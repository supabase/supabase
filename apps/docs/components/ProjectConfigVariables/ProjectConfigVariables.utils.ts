import type { BranchesData } from '~/lib/fetch/branches'
import type { OrganizationsData } from '~/lib/fetch/organizations'
import type { ProjectsData } from '~/lib/fetch/projects'

export type Org = OrganizationsData[number]
export type Project = ProjectsData[number]
export type Branch = BranchesData[number]

export type Variable = 'url' | 'anonKey'

export const prettyFormatVariable: Record<Variable, string> = {
  url: 'Project URL',
  anonKey: 'Anon key',
}

export function toDisplayNameOrgProject(org: Org, project: Project) {
  return `${org.name} / ${project.name}`
}

export function toOrgProjectValue(org: Org, project: Project) {
  // @ts-ignore -- problem in OpenAPI spec -- project has ref property
  return JSON.stringify([org.id, project.ref, toDisplayNameOrgProject(org, project)])
}

export function fromOrgProjectValue(
  maybeOrgProject: string
): [string, string, string] | [null, null, null] {
  try {
    const data = JSON.parse(maybeOrgProject)
    if (!Array.isArray(data) || data.length !== 3) {
      throw Error("Shape of parsed JSON doesn't match form of org and project value")
    }
    return data as [string, string, string]
  } catch {
    return [null, null, null]
  }
}

export function toBranchValue(branch: Branch) {
  return JSON.stringify([branch.id, branch.name])
}

export function fromBranchValue(maybeBranch: string): [string, string] | [null, null] {
  try {
    const data = JSON.parse(maybeBranch)
    if (!Array.isArray(data) || data.length !== 2) {
      throw Error("Shape of parsed JSON doesn't match form of branch value")
    }
    return data as [string, string]
  } catch {
    return [null, null]
  }
}
