import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { subscriptionKeys } from './keys'
import { ResponseError } from 'types'

export type ProjectAddonsVariables = {
  projectRef?: string
}

export type ProjectAddonType = 'compute_instance' | 'pitr' | 'custom_domain'

export type ProjectAddonVariant = {
  identifier: string
  name: string
  price: number
  price_description: string
  price_interval: 'monthly' | 'hourly'
  price_type: 'fixed' | 'usage'
  meta?: ProjectAddonVariantMeta
}

export interface ProjectAddonVariantMeta {
  cpu_cores?: number
  cpu_dedicated?: boolean
  baseline_disk_io_mbs?: number
  max_disk_io_mbs?: number
  memory_gb?: number
  connections_direct?: number
  connections_pooler?: number
  backup_duration_days?: number
}

export type ProjectSelectedAddon = {
  type: ProjectAddonType
  variant: ProjectAddonVariant
}

export type ProjectAddonsResponse = {
  ref: string
  selected_addons: ProjectSelectedAddon[]
  available_addons: {
    name: string
    type: ProjectAddonType
    variants: ProjectAddonVariant[]
  }[]
}

export async function getProjectAddons(
  { projectRef }: ProjectAddonsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await get(`${API_URL}/projects/${projectRef}/billing/addons`, { signal })
  if (response.error) throw response.error

  return response as ProjectAddonsResponse
}

export type ProjectAddonsData = Awaited<ReturnType<typeof getProjectAddons>>
export type ProjectAddonsError = ResponseError

export const useProjectAddonsQuery = <TData = ProjectAddonsData>(
  { projectRef }: ProjectAddonsVariables,
  { enabled = true, ...options }: UseQueryOptions<ProjectAddonsData, ProjectAddonsError, TData> = {}
) =>
  useQuery<ProjectAddonsData, ProjectAddonsError, TData>(
    subscriptionKeys.addons(projectRef),
    ({ signal }) => getProjectAddons({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
