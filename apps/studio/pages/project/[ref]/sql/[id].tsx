import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useParams } from 'common/hooks/useParams'
import { SQLEditor } from 'components/interfaces/SQLEditor/SQLEditor'
import SQLEditorLayout from 'components/layouts/SQLEditorLayout/SQLEditorLayout'
import { useContentIdQuery } from 'data/content/content-id-query'
import { useAppStateSnapshot } from 'state/app-state'
import { SnippetWithContent, useSnippets, useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import type { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'

const SqlEditor: NextPageWithLayout = () => {
  const router = useRouter()
  const { id, ref, content, skip } = useParams()

  const appSnap = useAppStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const allSnippets = useSnippets(ref!)

  // [Refactor] There's an unnecessary request getting triggered when we start typing while on /new
  // the URL ID gets updated and we attempt to fetch content for a snippet that's not been created yet
  const { data } = useContentIdQuery(
    { projectRef: ref, id },
    {
      // [Joshen] May need to investigate separately, but occasionally addSnippet doesnt exist in
      // the snapV2 valtio store for some reason hence why the added typeof check here
      retry: false,
      enabled: Boolean(id !== 'new' && typeof snapV2.addSnippet === 'function'),
    }
  )

  useEffect(() => {
    if (ref && data) {
      snapV2.setSnippet(ref, data as unknown as SnippetWithContent)
    }
  }, [ref, data])

  // Load the last visited snippet when landing on /new
  useEffect(() => {
    if (
      id === 'new' &&
      skip !== 'true' && // [Joshen] Skip flag implies to skip loading the last visited snippet
      appSnap.dashboardHistory.sql !== undefined &&
      content === undefined
    ) {
      const snippet = allSnippets.find((snippet) => snippet.id === appSnap.dashboardHistory.sql)
      if (snippet !== undefined) router.push(`/project/${ref}/sql/${appSnap.dashboardHistory.sql}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, allSnippets, content])

  return (
    <div className="flex-1 overflow-auto">
      <SQLEditor />
    </div>
  )
}

SqlEditor.getLayout = (page) => (
  <DefaultLayout>
    <SQLEditorLayout title="SQL">{page}</SQLEditorLayout>
  </DefaultLayout>
)

export default SqlEditor
