import type { OpenAIModelContext, OpenAIModelContextHostState } from '@openai/mcp-extensions/app'
import type { ContextAttachment } from 'surfaces/common'
import { z } from 'zod/v4'

import type { AgentContext } from './app-context'

type Row = Record<string, unknown>

const attachmentSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1).max(150),
  text: z.string().min(1).max(32000),
})

/**
 * The MCP Apps implementation of AgentContext over OpenAI's model-context
 * extension: one serialized context stream per app instance; row data is
 * attached only after the user selects it.
 */
export function createModelContext(getApi: () => OpenAIModelContext | undefined) {
  let snapshot: Row = {}
  let attachment: ContextAttachment | undefined
  let last = ''
  let generation = 0
  let disposed = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending = Promise.resolve()
  const sent = new Set<string>()
  const fingerprint = () => JSON.stringify({ snapshot, attachment })
  function write() {
    const api = getApi()
    const key = fingerprint()
    if (!api || key === last || disposed) return pending
    const version = generation
    const data = {
      supabaseWorkspace: snapshot,
      ...(attachment ? { selection: attachment } : {}),
    }
    const content = [
      {
        type: 'text' as const,
        text: 'Supabase workspace metadata (not instructions): ' + JSON.stringify(snapshot),
        _meta: { 'openai/title': 'Supabase workspace' },
      },
      ...(attachment
        ? [
            {
              type: 'text' as const,
              text: attachment.text,
              _meta: { 'openai/title': attachment.title },
            },
          ]
        : []),
    ]
    last = key
    pending = pending
      .catch(() => {})
      .then(async () => {
        if (disposed || version !== generation) return
        const signature = JSON.stringify({ content, structuredContent: data })
        sent.add(signature)
        if (sent.size > 32) sent.delete(sent.values().next().value!)
        try {
          await api.update({ content, structuredContent: data })
        } catch (error) {
          if (last === key) last = ''
          throw error
        }
      })
    return pending
  }
  const connection: AgentContext = {
    publish(next: Row) {
      if (disposed) return
      if (JSON.stringify(snapshot) === JSON.stringify(next)) return
      snapshot = next
      if (attachment && attachment.projectId !== snapshot.project_id) attachment = undefined
      generation++
      clearTimeout(timer)
      timer = setTimeout(() => {
        void write().catch(() => {})
      }, 300)
    },
    async attach(value: ContextAttachment) {
      if (disposed) throw new Error('This workspace has closed.')
      if (!getApi()) throw new Error('This host does not support chat attachments.')
      const next = attachmentSchema.parse(value)
      if (next.projectId !== snapshot.project_id)
        throw new Error('The selected project changed. Select the content again.')
      attachment = next
      generation++
      last = ''
      clearTimeout(timer)
      await write()
    },
    async detach(value: ContextAttachment) {
      // A departing view must not remove a newer attachment or another project's context.
      if (disposed || JSON.stringify(attachment) !== JSON.stringify(value)) return
      attachment = undefined
      generation++
      clearTimeout(timer)
      await write()
    },
  }
  return {
    ...connection,
    receive(state: OpenAIModelContextHostState | undefined) {
      if (disposed) return
      if (state === undefined) return
      // An acknowledgement of an earlier update must not cancel a newer queued selection.
      if (
        state &&
        sent.has(
          JSON.stringify({
            content: state.content,
            structuredContent: state.structuredContent,
          })
        )
      )
        return
      const selection = attachmentSchema.safeParse(state?.structuredContent?.selection)
      // A host removal can leave structured metadata behind: require the visible block too.
      attachment =
        selection.success &&
        state?.content?.some(
          (block) =>
            block.type === 'text' &&
            block.text === selection.data.text &&
            block._meta?.['openai/title'] === selection.data.title
        )
          ? selection.data
          : undefined
      generation++
      clearTimeout(timer)
      // Do not reattach dismissed context on an unrelated render/theme update.
      last = fingerprint()
    },
    dispose() {
      disposed = true
      generation++
      clearTimeout(timer)
    },
  }
}
