import type { IssueAffectedResource } from './issue.types'

export function getUniqueIssueResources(affected: Pick<IssueAffectedResource, 'resource'>[]) {
  return Array.from(
    new Map(
      affected.map(({ resource }) => [
        JSON.stringify([resource.type, resource.schema, resource.name]),
        resource,
      ])
    ).values()
  )
}
