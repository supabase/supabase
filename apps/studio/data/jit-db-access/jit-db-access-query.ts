import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { jitDbAccessKeys } from './keys'

export type JitDbAccessVariables = { projectRef?: string }

export async function getJitDbAccessConfiguration(
  { projectRef }: JitDbAccessVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/v1/projects/{ref}/jit-access`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  // jit access might not be available on the project due to
  // postgres version
  if (error) {
    const isNotAvailableError =
      (error as any)?.code === 400 && (error as any)?.message?.includes('unavailable')

    if (isNotAvailableError) {
      return {
        appliedSuccessfully: false,
        state: 'unavailable' as string,
        isUnavailable: true,
      } as const
    } else {
      handleError(error)
    }
  }

  return data
}

export type JitDbAccessData = Awaited<ReturnType<typeof getJitDbAccessConfiguration>>
export type JitDbAccessError = unknown

export const useJitDbAccessQuery = <TData = JitDbAccessData>(
  { projectRef }: JitDbAccessVariables,
  { enabled = true, ...options }: UseQueryOptions<JitDbAccessData, JitDbAccessError, TData> = {}
) =>
  useQuery<JitDbAccessData, JitDbAccessError, TData>(
    jitDbAccessKeys.status(projectRef),
    ({ signal }) => getJitDbAccessConfiguration({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
