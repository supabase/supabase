import { useParams } from 'common'
import { SqlEditor } from 'icons'
import Link from 'next/link'
import { Button } from 'ui'

import { useTrack } from '@/lib/telemetry/track'

export const ExplorerSqlEditorFooter = () => {
  const { ref } = useParams()
  const track = useTrack()

  if (!ref) return null

  return (
    <section
      aria-labelledby="explorer-sql-editor-footer-title"
      className="flex shrink-0 flex-col gap-3 border-t border-default p-3"
    >
      <div className="flex flex-col gap-1">
        <h3 id="explorer-sql-editor-footer-title" className="text-sm text-foreground">
          Looking for snippets?
        </h3>
        <p className="text-xs text-foreground-lighter">
          Your snippets can be accessed via the SQL Editor while Explorer is in preview.
        </p>
      </div>
      <Button asChild block variant="outline" icon={<SqlEditor size={14} strokeWidth={1.5} />}>
        <Link
          href={`/project/${ref}/sql`}
          onClick={() => track('explorer_temp_access_sql_editor_clicked')}
        >
          Open SQL Editor
        </Link>
      </Button>
    </section>
  )
}
