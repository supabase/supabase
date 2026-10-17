import type { QueryClient } from '@tanstack/react-query'
import type { ToolUIPart, UIMessage } from 'ai'

import { contentKeys } from '@/data/content/keys'
import { evictNotebookFromCaches } from '@/data/content/notebooks/notebook-cache'
import { TOOL_CONTRACTS, type ContractToolName } from '@/lib/ai/tools/registry'
import { notebooksState } from '@/state/notebooks/notebooks-state'

export type NotebookCacheEffect =
  | { _tag: 'upserted'; toolCallId: string; id: string }
  | { _tag: 'deleted'; toolCallId: string; id: string }

const NOTEBOOK_MUTATION_TOOLS = [
  'create_notebook',
  'update_notebook',
  'delete_notebook',
] as const satisfies readonly ContractToolName[]

const NOTEBOOK_MUTATION_CONTRACTS = {
  'tool-create_notebook': TOOL_CONTRACTS.create_notebook,
  'tool-update_notebook': TOOL_CONTRACTS.update_notebook,
  'tool-delete_notebook': TOOL_CONTRACTS.delete_notebook,
} as const

const NOTEBOOK_MUTATION_TOOL_TYPES: ReadonlySet<string> = new Set(
  NOTEBOOK_MUTATION_TOOLS.map((name) => `tool-${name}`)
)

function isNotebookMutationPart(
  part: UIMessage['parts'][number]
): part is ToolUIPart & { type: keyof typeof NOTEBOOK_MUTATION_CONTRACTS } {
  return NOTEBOOK_MUTATION_TOOL_TYPES.has(part.type)
}

export function collectNotebookCacheEffects(
  messages: Array<UIMessage>,
  processed: ReadonlySet<string>
): Array<NotebookCacheEffect> {
  const effects: Array<NotebookCacheEffect> = []

  for (const message of messages) {
    if (message.role !== 'assistant') continue

    for (const part of message.parts ?? []) {
      if (!isNotebookMutationPart(part)) continue
      if (part.state !== 'output-available') continue
      if (processed.has(part.toolCallId)) continue

      const result = NOTEBOOK_MUTATION_CONTRACTS[part.type].outputSchema.safeParse(part.output)
      if (!result.success) continue

      effects.push({
        _tag: part.type === 'tool-delete_notebook' ? 'deleted' : 'upserted',
        toolCallId: part.toolCallId,
        id: result.data.id,
      })
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
      const stateNotebook = notebooksState.notebooks[effect.id]
      if (stateNotebook && stateNotebook.status !== 'saved') {
        notebooksState.markServerDivergence({
          id: effect.id,
          type: effect._tag === 'deleted' ? 'deleted' : 'updated',
        })
        return
      }

      return evictNotebookFromCaches({ queryClient, projectRef, id: effect.id })
    })
  )
}
