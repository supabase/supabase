import { Badge } from 'ui'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { useUser } from 'common'

export type ReadOnlyBadgeProps = { id: string }
const ReadOnlyBadge = ({ id }: ReadOnlyBadgeProps) => {
  const user = useUser()
  const snap = useSqlEditorStateSnapshot()

  const snippet = snap.snippets[id]
  const isSnippetOwner = user?.user_metadata?.user_name === snippet?.snippet?.owner?.username

  return <>{isSnippetOwner ? null : <Badge>Read-only</Badge>}</>
}

export default ReadOnlyBadge
