import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { upsertContent, type UpsertContentPayload } from '../content-upsert-mutation'
import { contentKeys } from '../keys'
import { writableNotebookSchema, type WritableNotebook } from './notebook-schema'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

// TODO — Charis 2026-08-06
// UpsertContentPayload['type'] (generated from api-types) doesn't have 'notebook' yet — same
// gap tracked by the ContentBase TODO in content-query.ts. Widen locally and cast at the
// upsertContent call site until the generated type picks it up.
type NotebookUpsertPayload = Omit<UpsertContentPayload, 'type' | 'content'> & {
  type: 'notebook'
  content: WritableNotebook
}

function buildNotebookUpsertPayload({
  id,
  name,
  description,
  content,
}: {
  id: string
  name: string
  description?: string
  content: WritableNotebook
}): NotebookUpsertPayload {
  writableNotebookSchema.parse(content)

  return {
    id,
    name,
    description,
    type: 'notebook',
    visibility: 'project',
    content,
  }
}

export type CreateNotebookVariables = {
  projectRef: string
  name: string
  description?: string
  content: WritableNotebook
}

export async function createNotebook(
  { projectRef, name, description, content }: CreateNotebookVariables,
  signal?: AbortSignal,
  headersInit?: HeadersInit
) {
  const payload = buildNotebookUpsertPayload({
    id: crypto.randomUUID(),
    name,
    description,
    content,
  })

  return upsertContent(
    { projectRef, payload: payload as unknown as UpsertContentPayload },
    signal,
    headersInit
  )
}

export type CreateNotebookData = Awaited<ReturnType<typeof createNotebook>>

export type UpdateNotebookVariables = CreateNotebookVariables & { id: string }

export async function updateNotebook(
  { projectRef, id, name, description, content }: UpdateNotebookVariables,
  signal?: AbortSignal,
  headersInit?: HeadersInit
) {
  const payload = buildNotebookUpsertPayload({ id, name, description, content })

  return upsertContent(
    { projectRef, payload: payload as unknown as UpsertContentPayload },
    signal,
    headersInit
  )
}

export type UpdateNotebookData = Awaited<ReturnType<typeof updateNotebook>>

export const useCreateNotebookMutation = ({
  onError,
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<CreateNotebookData, ResponseError, CreateNotebookVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CreateNotebookData, ResponseError, CreateNotebookVariables>({
    mutationFn: (args) => createNotebook(args),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: contentKeys.allContentLists(projectRef) }),
        queryClient.invalidateQueries({ queryKey: contentKeys.infiniteList(projectRef) }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create notebook: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}

export const useUpdateNotebookMutation = ({
  onError,
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<UpdateNotebookData, ResponseError, UpdateNotebookVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UpdateNotebookData, ResponseError, UpdateNotebookVariables>({
    mutationFn: (args) => updateNotebook(args),
    async onSuccess(data, variables, context) {
      const { projectRef, id } = variables
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: contentKeys.allContentLists(projectRef) }),
        queryClient.invalidateQueries({ queryKey: contentKeys.infiniteList(projectRef) }),
        queryClient.invalidateQueries({ queryKey: contentKeys.resource(projectRef, id) }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update notebook: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}
