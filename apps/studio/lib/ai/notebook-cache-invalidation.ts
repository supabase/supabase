import type { QueryClient } from '@tanstack/react-query'
import type { ToolUIPart, UIMessage } from 'ai'

import { notebookToolOutputSchema } from '@/components/ui/AIAssistantPanel/Message.utils'
import { contentKeys } from '@/data/content/keys'
import { evictNotebookFromCaches } from '@/data/content/notebooks/notebook-cache'
import { notebooksState } from '@/state/notebooks/notebooks-state'

export type NotebookCacheEffect =
  | { _tag: 'upserted'; toolCallId: string; id: string }
  | { _tag: 'deleted'; toolCallId: string; id: string }

const NOTEBOOK_UPSERT_TOOL_TYPES = new Set(['tool-create_notebook', 'tool-update_notebook'])

function isNotebookUpsertPart(part: UIMessage['parts'][number]): part is ToolUIPart {
  return NOTEBOOK_UPSERT_TOOL_TYPES.has(part.type)
}

export function collectNotebookCacheEffects(
  messages: Array<UIMessage>,
  processed: ReadonlySet<string>
): Array<NotebookCacheEffect> {
  const effects: Array<NotebookCacheEffect> = []

  for (const message of messages) {
    if (message.role !== 'assistant') continue

    for (const part of message.parts ?? []) {
      if (!isNotebookUpsertPart(part)) continue
      if (part.state !== 'output-available') continue
      if (processed.has(part.toolCallId)) continue

      const result = notebookToolOutputSchema.safeParse(part.output)
      if (!result.success) continue

      effects.push({ _tag: 'upserted', toolCallId: part.toolCallId, id: result.data.id })
    }
  }

  return effects
}

export async function applyNotebookCacheEffects({
  queryClient,
  projectRef,
  effects,
}: {
  queryClient: QueryClient
  projectRef: string
  effects: Array<NotebookCacheEffect>
}): Promise<void> {
  if (effects.length === 0) return

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: contentKeys.allContentLists(projectRef) }),
    queryClient.invalidateQueries({ queryKey: contentKeys.infiniteList(projectRef) }),
  ])

  await Promise.all(
    effects.map((effect) => {
      // evictNotebookFromCaches's own dirty-notebook guard was loosened for the tab-close
      // flow, where `confirmClose` has already asked the user to discard unsaved edits.
      // There's no equivalent confirmation here, so a status check up front keeps a dirty
      // notebook untouched rather than having an assistant write silently discard local
      // edits (FE-4255).
      const stateNotebook = notebooksState.notebooks[effect.id]
      if (stateNotebook && stateNotebook.status !== 'saved') return

      return evictNotebookFromCaches({
        queryClient,
        projectRef,
        id: effect.id,
        // Always 'remove', not 'refresh': notebooksState.removeNotebook runs unconditionally
        // either way, so a mounted tab shows the same loading state regardless — but
        // 'refresh' (invalidateQueries) leaves the stale data cached, and a remounting
        // useNotebookQuery synchronously reads it before the refetch lands. setNotebook's
        // merge guard then treats that stale merge as "already loaded" and silently drops
        // the real update. 'remove' (removeQueries) clears the cache entry entirely, so
        // there's nothing stale to read.
        mode: 'remove',
      })
    })
  )
}
