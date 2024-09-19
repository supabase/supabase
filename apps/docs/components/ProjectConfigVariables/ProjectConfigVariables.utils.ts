import type { BranchesData } from '~/lib/fetch/branches'
import type { OrganizationsData } from '~/lib/fetch/organizations'
import type { ProjectsData } from '~/lib/fetch/projects'

export type Org = OrganizationsData[number]
export type Project = ProjectsData[number]
export type Branch = BranchesData[number]

export type Variable = 'url' | 'anonKey'

function removeDoubleQuotes(str: string) {
  return str.replaceAll('"', '')
}

function escapeDoubleQuotes(str: string) {
  return str.replaceAll('"', '\\"')
}

function unescapeDoubleQuotes(str: string) {
  /**
   * Regex matches a backslash followed by a double quote, except when the
   * backslash is escaped.
   *
   * Negative lookbehind:
   * \\(?:\\\\)* -> An odd number of backslashes (means the next backslash is escaped)
   * (?:^|[^\\]) -> Backslash group is at start or follows non-backslash
   */
  return str.replace(/(?<!(?:^|[^\\])\\(?:\\\\)*)\\"/g, '"')
}

export const prettyFormatVariable: Record<Variable, string> = {
  url: 'Project URL',
  anonKey: 'Anon key',
}

type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>
}

export function toDisplayNameOrgProject(org: DeepReadonly<Org>, project: DeepReadonly<Project>) {
  return `${org.name} / ${project.name}`
}

export function toOrgProjectValue(org: DeepReadonly<Org>, project: DeepReadonly<Project>) {
  return escapeDoubleQuotes(
    // @ts-ignore -- problem in OpenAPI spec -- project has ref property
    JSON.stringify([org.id, project.ref, removeDoubleQuotes(toDisplayNameOrgProject(org, project))])
  )
}

export function fromOrgProjectValue(
  maybeOrgProject: string
): [number, string, string] | [null, null, null] {
  try {
    // not restoring the double quotes on the display name is fine because it's only used for
    // command fuzzy search, not for exact/literal matching
    const data = JSON.parse(unescapeDoubleQuotes(maybeOrgProject))
    if (!Array.isArray(data) || data.length !== 3) {
      throw Error("Shape of parsed JSON doesn't match form of org and project value")
    }
    return data as [number, string, string]
  } catch {
    return [null, null, null]
  }
}

export function toBranchValue(branch: Branch) {
  return escapeDoubleQuotes(JSON.stringify([branch.id, removeDoubleQuotes(branch.name)]))
}

export function fromBranchValue(maybeBranch: string): [string, string] | [null, null] {
  try {
    // not restoring the double quotes on the branch name is fine because it's only used for
    // command fuzzy search, not for exact/literal matching
    const data = JSON.parse(unescapeDoubleQuotes(maybeBranch))
    if (!Array.isArray(data) || data.length !== 2) {
      throw Error("Shape of parsed JSON doesn't match form of branch value")
    }
    return data as [string, string]
  } catch {
    return [null, null]
  }
}
