import { useQuery } from '@tanstack/react-query'
import { useFlag, useParams } from 'common'

import type { UseLogsViewsResult } from './UnifiedLogs.views'
import {
  logsViewsQueryOptions,
  useDeleteLogsViewMutation,
  useSaveLogsViewMutation,
} from '@/data/content/logs-views-query'
import { useAsyncCheckUserContentPermissions } from '@/hooks/misc/useCheckPermissionsV2'
import { IS_PLATFORM } from '@/lib/constants'

export const LOGS_SAVED_VIEWS_FLAG = 'logsSavedViews'

export const useLogsViews = (): UseLogsViewsResult => {
  const { ref: projectRef } = useParams()
  const flagEnabled = useFlag(LOGS_SAVED_VIEWS_FLAG)
  const enabled = IS_PLATFORM && !!flagEnabled
  const { can: canWrite } = useAsyncCheckUserContentPermissions('project_snippets_write', {
    mode: 'create',
    type: 'log_sql',
  })
  const query = useQuery({
    ...logsViewsQueryOptions({ projectRef }),
    enabled: enabled && !!projectRef,
  })
  const save = useSaveLogsViewMutation()
  const remove = useDeleteLogsViewMutation()
  const views = enabled ? (query.data ?? []) : []
  const requireProject = () => {
    if (!enabled || !projectRef || !canWrite)
      throw new Error('You do not have permission to save views')
    return projectRef
  }

  return {
    views,
    isLoading: enabled && query.isLoading,
    isError: enabled && query.isError,
    error: query.error,
    isPending: save.isPending || remove.isPending,
    canCreate: enabled && canWrite,
    canUpdate: enabled && canWrite,
    canDelete: enabled && canWrite,
    retry: () => {
      if (enabled && projectRef) void query.refetch()
    },
    createView: (input) =>
      save.mutateAsync({ projectRef: requireProject(), id: crypto.randomUUID(), input }),
    updateView: async (id, input) => {
      const view = views.find((view) => view.id === id)
      if (!view) throw new Error('Saved view not found')
      await save.mutateAsync({ projectRef: requireProject(), id, input: { ...view, ...input } })
    },
    deleteView: async (id) => {
      if (!views.some((view) => view.id === id)) throw new Error('Saved view not found')
      await remove.mutateAsync({ projectRef: requireProject(), ids: [id] })
    },
  }
}
