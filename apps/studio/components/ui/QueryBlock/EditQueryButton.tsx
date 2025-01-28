import { Edit } from 'lucide-react'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { TelemetryActions } from 'common/telemetry-constants'
import { DiffType } from 'components/interfaces/SQLEditor/SQLEditor.types'
import useNewQuery from 'components/interfaces/SQLEditor/hooks'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import Link from 'next/link'
import { ComponentProps } from 'react'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TooltipContent,
} from 'ui'
import { ButtonTooltip } from '../ButtonTooltip'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'

interface EditQueryButtonProps {
  id?: string
  title: string
  sql?: string
}

export const EditQueryButton = ({ id, sql, title }: EditQueryButtonProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const { newQuery } = useNewQuery()
  const sqlEditorSnap = useSqlEditorV2StateSnapshot()

  const isInSQLEditor = router.pathname.includes('/sql')
  const isInNewSnippet = router.pathname.endsWith('/sql')
  const tooltip: { content: ComponentProps<typeof TooltipContent> & { text: string } } = {
    content: { side: 'bottom', text: 'Edit in SQL Editor' },
  }

  const org = useSelectedOrganization()
  const { mutate: sendEvent } = useSendEventMutation()

  const handleEditInSQLEditor = () => {
    if (sql) {
      if (isInSQLEditor) {
        sqlEditorSnap.setDiffContent(sql, DiffType.Addition)
      } else {
        newQuery(sql, title)
      }
    }
  }

  if (id !== undefined) {
    return (
      <ButtonTooltip
        asChild
        type="text"
        size="tiny"
        className="w-7 h-7"
        icon={<Edit size={14} />}
        tooltip={tooltip}
      >
        <Link href={`/project/${ref}/sql/${id}`} />
      </ButtonTooltip>
    )
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
          groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
        })
      }}
      tooltip={tooltip}
    />
  ) : (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ButtonTooltip
          type="text"
          size="tiny"
          disabled={!sql}
          className="w-7 h-7"
          icon={<Edit size={14} />}
          tooltip={!!sql ? tooltip : { content: { side: 'bottom', text: undefined } }}
        />
      </DropdownMenuTrigger>
      {!!sql && (
        <DropdownMenuContent className="w-36">
          <DropdownMenuItem onClick={() => sqlEditorSnap.setDiffContent(sql, DiffType.Addition)}>
            Insert code
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => sqlEditorSnap.setDiffContent(sql, DiffType.Modification)}
          >
            Replace code
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => sqlEditorSnap.setDiffContent(sql, DiffType.NewSnippet)}>
            Create new snippet
          </DropdownMenuItem>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  )
}
