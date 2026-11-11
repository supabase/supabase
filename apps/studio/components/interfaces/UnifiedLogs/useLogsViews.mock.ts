// TODO(saved-views): dev-only stand-in for real persistence. Replace with a
// data/content-backed hook (see apps/studio/data/content/content-query.ts) once
// PR2 lands — likely reusing the existing `log_sql` content type rather than
// adding a new one, since Studio can't add a new `type` value to the generated
// platform API enum unilaterally (packages/api-types/types/platform.d.ts).

import { LOCAL_STORAGE_KEYS } from 'common'

import {
  LOGS_VIEW_VERSION,
  type LogsView,
  type LogsViewDraft,
  type UseLogsViewsResult,
} from './UnifiedLogs.views'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

export const useLogsViewsMock = (): UseLogsViewsResult => {
  const [views, setViews, { isLoading, isError, error }] = useLocalStorageQuery<LogsView[]>(
    LOCAL_STORAGE_KEYS.UNIFIED_LOGS_SAVED_VIEWS,
    []
  )

  const createView = (input: LogsViewDraft) => {
    const view: LogsView = {
      id: crypto.randomUUID(),
      type: 'logs_view',
      version: LOGS_VIEW_VERSION,
      ...input,
    }
    setViews((current) => [...current, view])
  }

  const updateView = (
    id: string,
    input: Partial<Pick<LogsView, 'name' | 'filters' | 'viewOptions'>>
  ) => {
    setViews((current) => current.map((view) => (view.id === id ? { ...view, ...input } : view)))
  }

  const deleteView = (id: string) => {
    setViews((current) => current.filter((view) => view.id !== id))
  }

  return { views, isLoading, isError, error, createView, updateView, deleteView }
}
