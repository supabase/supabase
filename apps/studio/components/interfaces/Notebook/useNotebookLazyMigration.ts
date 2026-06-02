import { useEffect, useRef } from 'react'

import {
  isLegacySnippetBlock,
  migrateSnippetBlockToEmbedded,
  unmapNotebookContentForApi,
} from '@/components/interfaces/Notebook/notebookBlock.utils'
import { getContentById } from '@/data/content/content-id-query'
import type { Content } from '@/data/content/content-query'
import { upsertContent } from '@/data/content/content-upsert-mutation'
import type { Dashboards, SqlSnippets } from '@/types'

export function useNotebookLazyMigration({
  projectRef,
  notebook,
  notebookContent,
  onMigrated,
}: {
  projectRef: string | undefined
  notebook: Content | undefined
  notebookContent: Dashboards.Content | undefined
  onMigrated: (content: Dashboards.Content) => void
}) {
  const migrationStarted = useRef(false)

  useEffect(() => {
    if (!projectRef || !notebook?.id || !notebookContent || migrationStarted.current) return

    const legacyBlocks = notebookContent.layout.filter(isLegacySnippetBlock)
    if (legacyBlocks.length === 0) return

    migrationStarted.current = true

    void (async () => {
      let layout = [...notebookContent.layout]
      let changed = false

      for (const block of legacyBlocks) {
        try {
          const snippet = await getContentById({ projectRef, id: block.id })
          const snippetSql = snippet?.content as SqlSnippets.Content | undefined
          layout = layout.map((item) =>
            item.id === block.id ? migrateSnippetBlockToEmbedded(item, snippetSql) : item
          )
          changed = true
        } catch {
          layout = layout.map((item) =>
            item.id === block.id ? migrateSnippetBlockToEmbedded(item, null) : item
          )
          changed = true
        }
      }

      if (!changed) return

      const nextContent: Dashboards.Content = { ...notebookContent, layout }
      onMigrated(nextContent)

      await upsertContent({
        projectRef,
        payload: {
          ...notebook,
          id: notebook.id,
          type: 'report',
          content: unmapNotebookContentForApi(nextContent),
        },
      })
    })()
  }, [projectRef, notebook, notebookContent, onMigrated])
}
