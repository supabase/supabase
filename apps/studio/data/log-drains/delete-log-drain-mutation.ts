import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { handleError, del } from 'data/fetchers'
import type { ResponseError } from 'types'
import { logDrainsKeys } from './keys'

export type LogDrainDeleteVariables = {
  projectRef: string
  id: number
}

export async function deleteLogDrain({ projectRef, id }: LogDrainDeleteVariables) {
  // @ts-ignore Just sample, TS lint will validate if the endpoint is valid
  // const { data, error } = await del('/platform/projects/{ref}/resources/{id}', {
  //   params: { path: { ref: projectRef, id } },
  // })

  // if (error) handleError(error)
  // return data

  // remove from localstorage for now
  await new Promise((resolve) => setTimeout(resolve, 1000))

  console.log('deleting log drain', id)

  let logDrains = JSON.parse(localStorage.getItem('logDrains') || '[]')
  logDrains = logDrains.filter((drain: any) => drain.id !== id)
  localStorage.setItem('logDrains', JSON.stringify(logDrains))

  return
}

type LogDrainDeleteData = Awaited<ReturnType<typeof deleteLogDrain>>

export const useDeleteLogDrainMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<LogDrainDeleteData, ResponseError, LogDrainDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<LogDrainDeleteData, ResponseError, LogDrainDeleteVariables>(
    (vars) => deleteLogDrain(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await queryClient.invalidateQueries(logDrainsKeys.list(projectRef))

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to mutate: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
