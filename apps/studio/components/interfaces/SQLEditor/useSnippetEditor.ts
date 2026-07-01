import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect, useEffectEvent, useState } from 'react'

import { createSqlSnippetSkeletonV2 } from './SQLEditor.utils'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useProfile } from '@/lib/profile'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'
import { wasNeverPersisted } from '@/state/sql-editor/sql-editor-lifecycle'
import { canEditSnippet } from '@/state/sql-editor/sql-editor-rules'
import { useTabsStateSnapshot } from '@/state/tabs'

/**
 * Owns the editing lifecycle of a single SQL snippet: tracking the editor text,
 * creating the snippet in the store on first edit (and routing to its URL),
 * persisting debounced changes via `setSql`, and seeding the editor from a
 * `?content=` deep link.
 *
 * Extracted from `MonacoEditor` so that component stays a thin editor shell.
 */
export function useSnippetEditor({ id, snippetName }: { id: string; snippetName: string }) {
  const router = useRouter()
  const { profile } = useProfile()
  const { ref, content } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const snapV2 = useSqlEditorV2StateSnapshot()
  const tabsSnap = useTabsStateSnapshot()

  const [value, setValue] = useState('')
  const debouncedValue = useDebounce(value, 1000)

  const snippet = snapV2.snippets[id]
  const disableEdit = !!snippet && !canEditSnippet(snippet.snippet, profile?.id)

  function handleEditorChange(value: string | undefined) {
    tabsSnap.makeActiveTabPermanent()
    if (!id || !value) return

    if (!snippet && ref && profile !== undefined && project !== undefined) {
      const newSnippet = createSqlSnippetSkeletonV2({
        idOverride: id,
        name: snippetName,
        sql: value,
        owner_id: profile?.id,
        project_id: project?.id,
      })
      snapV2.addSnippet({ projectRef: ref, snippet: newSnippet })
      // When the editor was seeded from a `content` deep-link, replace rather
      // than push. The caller navigated to `/sql/new?content=...` (a long,
      // one-shot URL); replacing collapses it out of history so Back returns to
      // the originating page instead of a wasted step that re-seeds the snippet.
      if (router.query.content !== undefined) {
        router.replace(`/project/${ref}/sql/${newSnippet.id}`, undefined, { shallow: true })
      } else {
        router.push(`/project/${ref}/sql/${newSnippet.id}`, undefined, { shallow: true })
      }
    }
    setValue(value)
  }

  useEffect(() => {
    if (debouncedValue.length > 0 && snippet) {
      const shouldInvalidate = wasNeverPersisted(snippet.snippet.status)
      snapV2.setSql({ id, sql: value, shouldInvalidate })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue])

  // if an SQL query is passed by the content parameter, set the editor value to its content. This
  // is usually used for sending the user to SQL editor from other pages with SQL.
  const seedFromContentParam = useEffectEvent(() => {
    if (content && content.length > 0) handleEditorChange(content)
  })
  useEffect(() => {
    seedFromContentParam()
    // The useEffectEvent return is stable and must not be a dependency; this
    // disable can go once our eslint version understands useEffectEvent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { snippet, disableEdit, handleEditorChange }
}
