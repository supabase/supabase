import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'
import { miscKeys } from './keys'


export async function getDockerHubStudioVersions() {
  try {
    const data = await fetch(`${BASE_PATH}/api/get-docker-hub-versions`).then((res) => res.json())
    return data as { latest: string | null, last_updated_at: string | null }
  } catch (error) {
    throw error
  }
}

export type DockerHubStudioVersionsData = Awaited<ReturnType<typeof getDockerHubStudioVersions>>
export type DockerHubStudioVersionsError = ResponseError

export const useDockerHubStudioVersionsQuery = <TData = DockerHubStudioVersionsData>(
  { enabled = true, ...options }: UseQueryOptions<DockerHubStudioVersionsData, DockerHubStudioVersionsError, TData> = {}
) =>
  useQuery<DockerHubStudioVersionsData, DockerHubStudioVersionsError, TData>(
    miscKeys.dockerHubVersions(),
    () => getDockerHubStudioVersions(),
    { enabled: enabled && !IS_PLATFORM, ...options }
  )
