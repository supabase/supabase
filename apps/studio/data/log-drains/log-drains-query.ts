import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { logDrainsKeys } from './keys'
import { ResponseError } from 'types'
import { LogDrainSource } from 'components/interfaces/LogDrains/LogDrains.constants'

export type LogDrainsVariables = {
  ref?: string
}

export async function getLogDrains({ ref }: LogDrainsVariables, signal?: AbortSignal) {
  //   const { data, error } = await get(`/todo-add-endpoint`, {
  //     params: { path: { ref: ref } },
  //     signal,
  //   })

  //   if (error) {
  //     handleError(error)
  //   }

  //   return data;

  // return [
  //   {
  //       config: {},
  //       id: 12,
  //       inserted_at: '2021-10-14T14:00:00.000000Z',
  //       name: 'DataDog',
  //       token: '1234567890',
  //       updated_at: '2021-10-14T14:00:00.000000Z',
  //     },
  //   ]

  // return from localstorage for now
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const logDrains = JSON.parse(localStorage.getItem('logDrains') || '[]')

  return logDrains as {
    config: Record<string, any>
    id: number
    source: LogDrainSource
    inserted_at: string
    name: string
    token: string
    updated_at: string
  }[]
}

export type LogDrainsData = Awaited<ReturnType<typeof getLogDrains>>
export type LogDrainData = LogDrainsData[number]
export type LogDrainsyError = ResponseError

export const useLogDrainsQuery = <TData = LogDrainsData>(
  { ref }: LogDrainsVariables,
  { enabled, ...options }: UseQueryOptions<LogDrainsData, LogDrainsyError, TData> = {}
) =>
  useQuery<LogDrainsData, LogDrainsyError, TData>(
    logDrainsKeys.list(ref),
    ({ signal }) => getLogDrains({ ref }, signal),
    {
      enabled: enabled && !!ref,
      refetchOnMount: false,
      ...options,
    }
  )
