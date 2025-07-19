import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { fetchHandler } from 'data/fetchers'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'
import { miscKeys } from './keys'

export async function getCLIReleaseVersion() {
  try {
    const data = await fetchHandler(`${BASE_PATH}/api/cli-release-version`).then((res) =>
      res.json()
    )
    return data as { current?: string; latest?: string; beta?: string; published_at?: string }
  } catch (error) {
    throw error
  }
}

export type CLIReleaseVersionData = Awaited<ReturnType<typeof getCLIReleaseVersion>>
export type CLIReleaseVersionError = ResponseError

export const useCLIReleaseVersionQuery = <TData = CLIReleaseVersionData>({
  enabled = true,
  ...options
}: UseQueryOptions<CLIReleaseVersionData, CLIReleaseVersionError, TData> = {}) =>
  useQuery<CLIReleaseVersionData, CLIReleaseVersionError, TData>(
    miscKeys.cliReleaseVersion(),
    () => getCLIReleaseVersion(),
    { enabled: enabled && !IS_PLATFORM, ...options }
  )
