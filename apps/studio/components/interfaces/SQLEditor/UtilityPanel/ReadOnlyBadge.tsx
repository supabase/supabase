import { useProfile } from 'lib/profile'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { Badge } from 'ui'

export type ReadOnlyBadgeProps = { id: string }
const ReadOnlyBadge = ({ id }: ReadOnlyBadgeProps) => {
  const { profile } = useProfile()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const snippet = snapV2.snippets[id]
  const isSnippetOwner = profile?.id === snippet?.snippet.owner_id

  return <>{isSnippetOwner ? null : <Badge>Read-only</Badge>}</>
}

export default ReadOnlyBadge
