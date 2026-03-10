import type { OrganizationsData } from '@/lib/fetch/organizations'
import type { ProjectInfoInfinite } from '@/lib/fetch/projects'

export type Org = OrganizationsData[number]

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
   */
  return str.replace(/(?<!(?:^|[^\\])\\(?:\\\\)*)\\"/g, '"')
}

type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>
}

export function toDisplayNameOrgProject(
  org: DeepReadonly<Org>,
  project: DeepReadonly<ProjectInfoInfinite>
) {
  return `${org.name} / ${project.name}`
}

export function toOrgProjectValue(
  org: DeepReadonly<Org>,
  project: DeepReadonly<ProjectInfoInfinite>
) {
  return escapeDoubleQuotes(
    // @ts-ignore -- problem in OpenAPI spec -- project has ref property
    JSON.stringify([org.id, project.ref, removeDoubleQuotes(toDisplayNameOrgProject(org, project))])
  )
}

export function fromOrgProjectValue(
  maybeOrgProject: string
): [number, string, string] | [null, null, null] {
  try {
    const data = JSON.parse(unescapeDoubleQuotes(maybeOrgProject))
    if (!Array.isArray(data) || data.length !== 3) {
      throw Error("Shape of parsed JSON doesn't match form of org and project value")
    }
    return data as [number, string, string]
  } catch {
    return [null, null, null]
  }
}
