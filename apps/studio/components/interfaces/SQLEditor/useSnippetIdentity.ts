import { useParams } from 'common'
import { useMemo } from 'react'

import { generateSnippetTitle } from './SQLEditor.constants'
import { generateUuid } from '@/lib/api/snippets.browser'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor/sql-editor-state'

/**
 * Derives the stable snippet id + display name for the editor from the URL.
 *
 * For `/sql/new` (or no id) a fresh name + uuid are generated; otherwise the URL
 * id is used. `isLoading` is true while an existing snippet's content is still
 * being fetched.
 */
export function useSnippetIdentity() {
  const { id: urlId } = useParams()
  const snapV2 = useSqlEditorV2StateSnapshot()

  // generate a new snippet title and an id to be used for new snippets. The dependency on urlId is to avoid a bug which
  // shows up when clicking on the SQL Editor while being in the SQL editor on a random snippet.
  const [generatedNewSnippetName, generatedId] = useMemo(() => {
    const name = generateSnippetTitle()
    return [name, generateUuid([`${name}.sql`])]
  }, [urlId])

  // the id is stable across renders - it depends either on the url or on the memoized generated id
  const id = !urlId || urlId === 'new' ? generatedId : urlId

  const snippetIsLoading = !(
    id in snapV2.snippets && snapV2.snippets[id].snippet.content !== undefined
  )
  const isLoading = urlId === 'new' ? false : snippetIsLoading

  return { id, urlId, generatedNewSnippetName, isLoading }
}
