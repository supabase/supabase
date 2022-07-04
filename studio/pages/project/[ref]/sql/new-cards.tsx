import SQLCard from 'components/interfaces/SQLEditor/SQLCard'
import { SQLEditorLayout } from 'components/layouts'
import { useSqlSnippetsQuery } from 'data/sql/useSqlSnippetsQuery'
import { useParams } from 'lib/params'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { NextPageWithLayout } from 'types'

const SqlEditorPage: NextPageWithLayout = () => {
  const snap = useSqlEditorStateSnapshot()
  const { ref: projectRef, id } = useParams()
  const { data, isLoading, isSuccess } = useSqlSnippetsQuery(projectRef, {
    onSuccess(data) {
      if (projectRef) {
        snap.setInitialSnippets(data.snippets, projectRef)
      }
    },
  })

  return (
    <div className="mx-auto my-8 flex w-full max-w-5xl flex-col gap-6 px-4">
      {isSuccess && data.snippets.map((snippet) => <SQLCard id={snippet.id!} />)}
    </div>
  )
}

SqlEditorPage.getLayout = (page) => <SQLEditorLayout title="SQL">{page}</SQLEditorLayout>

export default SqlEditorPage
