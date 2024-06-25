'use client'

import { useConfig } from '../hooks/use-config'

export function selectedProject() {}

export function allProjects(orgs, organization: string | undefined, project: string | undefined) {
  return orgs.find((org) => org.key === organization)?.projects || []
}
