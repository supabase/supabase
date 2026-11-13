import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { deleteContents } from './content-delete-mutation'
import { contentKeys } from './keys'
import { getAllLogContent, isLogsViewContent, logsViewContentSchema } from './logs-view-content'
import type { LogsView, LogsViewDraft } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.views'
import { handleError, put } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'

export const logsViewsQueryOptions = ({ projectRef }: { projectRef?: string }) =>
  queryOptions({
    queryKey: contentKeys.logsViews(projectRef),
    queryFn: async ({ signal }) => {
      const rows = await getAllLogContent({ projectRef }, signal)
      return rows.flatMap((row): LogsView[] => {
        if (!isLogsViewContent(row)) return []
        const result = logsViewContentSchema.safeParse(row.content)
        return result.success ? [{ ...result.data, id: row.id, name: row.name }] : []
      })
    },
    enabled: IS_PLATFORM && !!projectRef,
  })

type LogsViewWriteVariables = {
  projectRef: string
  id: string
  input: LogsViewDraft
}

async function saveLogsView({ projectRef, id, input }: LogsViewWriteVariables) {
  const { name, ...content } = input
  const { error } = await put('/platform/projects/{ref}/content', {
    params: { path: { ref: projectRef } },
    body: {
      id,
      name,
      type: 'log_sql',
      visibility: 'project',
      content: { ...content, type: 'logs_view', version: 1 },
    },
    headers: { Version: '2' },
  })
  if (error) handleError(error)
  return id
}

export function useSaveLogsViewMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveLogsView,
    onSuccess: async (_, { projectRef }) => {
      await queryClient.invalidateQueries({ queryKey: contentKeys.allContentLists(projectRef) })
      await queryClient.invalidateQueries({ queryKey: contentKeys.infiniteList(projectRef) })
    },
    onError: (error) => toast.error(`Failed to save view: ${error.message}`),
  })
}

export function useDeleteLogsViewMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (variables: Parameters<typeof deleteContents>[0]) => deleteContents(variables),
    onSuccess: async (_, { projectRef }) => {
      await queryClient.invalidateQueries({ queryKey: contentKeys.allContentLists(projectRef) })
      await queryClient.invalidateQueries({ queryKey: contentKeys.infiniteList(projectRef) })
    },
    onError: (error) => toast.error(`Failed to delete view: ${error.message}`),
  })
}
