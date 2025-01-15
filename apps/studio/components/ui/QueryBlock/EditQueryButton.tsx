import { Edit } from 'lucide-react'
import { useRouter } from 'next/router'

import { DiffType } from 'components/interfaces/SQLEditor/SQLEditor.types'
import useNewQuery from 'components/interfaces/SQLEditor/hooks'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { TelemetryActions } from 'lib/constants/telemetry'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'ui'
import { ButtonTooltip } from '../ButtonTooltip'

interface EditQueryButtonProps {
  title: string
  sql: string
}

export const EditQueryButton = ({ sql, title }: EditQueryButtonProps) => {
  const router = useRouter()
  const { newQuery } = useNewQuery()
  const sqlEditorSnap = useSqlEditorV2StateSnapshot()

  const isInSQLEditor = router.pathname.includes('/sql')
  const isInNewSnippet = router.pathname.endsWith('/sql')

  const { mutate: sendEvent } = useSendEventMutation()

  const handleEditInSQLEditor = () => {
    if (isInSQLEditor) {
      sqlEditorSnap.setDiffContent(sql, DiffType.Addition)
    } else {
      newQuery(sql, title)
    }
  }

  return !isInSQLEditor || isInNewSnippet ? (
    <ButtonTooltip
      type="text"
      size="tiny"
      className="w-7 h-7"
      icon={<Edit size={14} />}
      onClick={() => {
        handleEditInSQLEditor()
        sendEvent({
          action: TelemetryActions.ASSISTANT_EDIT_IN_SQL_EDITOR_CLICKED,
          properties: {
            isInSQLEditor,
            isInNewSnippet,
          },
        })
      }}
      tooltip={{ content: { side: 'bottom', text: 'Edit in SQL Editor' } }}
    />
  ) : (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ButtonTooltip
          type="text"
          size="tiny"
          className="w-7 h-7"
          icon={<Edit size={14} />}
          tooltip={{ content: { side: 'bottom', text: 'Edit in SQL Editor' } }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-36">
        <DropdownMenuItem onClick={() => sqlEditorSnap.setDiffContent(sql, DiffType.Addition)}>
          Insert code
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => sqlEditorSnap.setDiffContent(sql, DiffType.Modification)}>
          Replace code
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => sqlEditorSnap.setDiffContent(sql, DiffType.NewSnippet)}>
          Create new snippet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
