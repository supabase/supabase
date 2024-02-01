import { PermissionAction } from '@supabase/shared-types/out/constants'
import clsx from 'clsx'
import { IS_PLATFORM, useParams } from 'common'
import { useRouter } from 'next/router'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconChevronDown,
  IconCopy,
  IconDownload,
  IconEdit2,
  IconShare,
  IconTrash,
} from 'ui'

import { createSqlSnippetSkeleton } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { SqlSnippet } from 'data/content/sql-snippets-query'
import { useCheckPermissions, useSelectedProject, useStore } from 'hooks'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'

interface QueryItemActionsProps {
  tabInfo: SqlSnippet
  activeId: string | undefined
  open: boolean
  setOpen: (value: boolean) => void
  onSelectRenameQuery: () => void
  onSelectDeleteQuery: () => void
  onSelectShareQuery: () => void
  onSelectDownloadQuery: () => void
}

export const QueryItemActions = ({
  tabInfo,
  activeId,
  open,
  setOpen,
  onSelectRenameQuery,
  onSelectDeleteQuery,
  onSelectShareQuery,
  onSelectDownloadQuery,
}: QueryItemActionsProps) => {
  const { ui } = useStore()
  const { ref } = useParams()
  const router = useRouter()
  const { profile } = useProfile()

  const snap = useSqlEditorStateSnapshot()
  const project = useSelectedProject()

  const { id, name, visibility, content } = tabInfo || {}
  const isActive = id === activeId

  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const { id: snippetID } = tabInfo || {}
  const snippet =
    snippetID !== undefined && snap.snippets && snap.snippets[snippetID] !== undefined
      ? snap.snippets[snippetID]
      : null

  const isSnippetOwner = profile?.id === snippet?.snippet.owner_id

  const onClickRename = (e: any) => {
    e.stopPropagation()
    onSelectRenameQuery()
  }

  const onClickShare = (e: any) => {
    e.stopPropagation()
    onSelectShareQuery()
  }

  const onClickDelete = (e: any) => {
    e.stopPropagation()
    onSelectDeleteQuery()
  }

  const createPersonalCopy = async () => {
    if (!ref) return console.error('Project ref is required')
    if (!id) return console.error('Snippet ID is required')
    try {
      const snippet = createSqlSnippetSkeleton({
        id: uuidv4(),
        name,
        sql: content.sql,
        owner_id: profile?.id,
        project_id: project?.id,
      })
      snap.addSnippet(snippet as SqlSnippet, ref)
      snap.addNeedsSaving(snippet.id!)
      router.push(`/project/${ref}/sql/${snippet.id}`)
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to create a personal copy of this query: ${error.message}`,
      })
    }
  }

  return (
    <div className="group [div&>button[data-state='open']>span]:text-foreground-lighter flex items-center">
      {IS_PLATFORM ? (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <span
              tabIndex={0}
              onClick={() => setOpen(true)}
              className={clsx(
                'rounded p-1 cursor-pointer',
                isActive
                  ? 'text-foreground-light hover:bg-border-stronger'
                  : 'text-background hover:bg-overlay-hover group-hover:text-foreground-light'
              )}
            >
              <IconChevronDown size="tiny" strokeWidth={2} />
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className=" w-52 translate-x-[4px]">
            {isSnippetOwner && (
              <DropdownMenuItem onClick={onClickRename} className="space-x-2">
                <IconEdit2 size="tiny" />
                <p>Rename query</p>
              </DropdownMenuItem>
            )}

            {visibility === 'user' && canCreateSQLSnippet && (
              <DropdownMenuItem onClick={onClickShare} className="space-x-2">
                <IconShare size="tiny" />
                <p>Share query</p>
              </DropdownMenuItem>
            )}
            {visibility === 'project' && canCreateSQLSnippet && (
              <DropdownMenuItem onClick={createPersonalCopy} className="space-x-2">
                <IconCopy size="tiny" />
                <p>Duplicate personal copy</p>
              </DropdownMenuItem>
            )}

            {IS_PLATFORM && (
              <DropdownMenuItem onClick={() => onSelectDownloadQuery()} className="space-x-2">
                <IconDownload size="tiny" />
                <p>Download as migration file</p>
              </DropdownMenuItem>
            )}
            {isSnippetOwner && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onClickDelete} className="space-x-2">
                  <IconTrash size="tiny" />
                  <p>Delete query</p>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button asChild disabled type="text" style={{ padding: '3px' }}>
          <span />
        </Button>
      )}
    </div>
  )
}
