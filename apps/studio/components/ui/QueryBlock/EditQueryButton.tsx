import { useParams } from 'common'
import { useIsInlineEditorEnabled } from 'components/interfaces/Account/Preferences/InlineEditorSettings'
import useNewQuery from 'components/interfaces/SQLEditor/hooks'
import { DiffType } from 'components/interfaces/SQLEditor/SQLEditor.types'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Edit } from 'lucide-react'
import { useRouter } from 'next/router'
import { ComponentProps } from 'react'
import { editorPanelState } from 'state/editor-panel-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TooltipContent,
} from 'ui'

import { ButtonTooltip } from '../ButtonTooltip'

interface EditQueryButtonProps {
  id?: string
  title: string
  sql?: string
  className?: string
  type?: 'default' | 'text'
}

export const EditQueryButton = ({
  id,
  sql,
  title,
  className,
  type = 'text',
}: EditQueryButtonProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const { newQuery } = useNewQuery()

  const sqlEditorSnap = useSqlEditorV2StateSnapshot()
  const { closeSidebar, openSidebar } = useSidebarManagerSnapshot()

  const isInSQLEditor = router.pathname.includes('/sql')
  const isInNewSnippet = router.pathname.endsWith('/sql')
  const isInlineEditorEnabled = useIsInlineEditorEnabled()
  const tooltip: { content: ComponentProps<typeof TooltipContent> & { text: string } } = {
    content: { side: 'bottom', text: 'Edit in SQL Editor' },
  }

  const { data: org } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()

  if (id !== undefined) {
    return (
      <ButtonTooltip
        type={type}
        size="tiny"
        className={cn('w-7 h-7', className)}
        icon={<Edit size={14} strokeWidth={1.5} />}
        tooltip={tooltip}
        onClick={() => {
          editorPanelState.setActiveSnippetId(id)
          openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
        }}
      />
    )
  }

  return !isInSQLEditor || isInNewSnippet ? (
    <ButtonTooltip
      type={type}
      size="tiny"
      className={cn('w-7 h-7', className)}
      icon={<Edit size={14} strokeWidth={1.5} />}
      onClick={() => {
        if (isInlineEditorEnabled) {
          // This component needs to be updated to work with local EditorPanel state
          // For now, fall back to creating a new query
          if (sql) newQuery(sql, title)
          closeSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
        } else {
          if (sql) newQuery(sql, title)
        }
        sendEvent({
          action: 'assistant_edit_in_sql_editor_clicked',
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
          type={type}
          size="tiny"
          disabled={!sql}
          className={cn('w-7 h-7', className)}
          icon={<Edit size={14} strokeWidth={1.5} />}
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
          <DropdownMenuItem onClick={() => newQuery(sql, title)}>
            Create new snippet
          </DropdownMenuItem>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  )
}
