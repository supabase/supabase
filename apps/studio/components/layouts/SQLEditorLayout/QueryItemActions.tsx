import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM, useParams } from 'common'
import { Copy, Download, Edit, MoreHorizontal, Share, Trash } from 'lucide-react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

import { createSqlSnippetSkeleton } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import type { SqlSnippet } from 'data/content/sql-snippets-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'

interface QueryItemActionsProps {
  tabInfo: SqlSnippet
  open: boolean
  setOpen: (value: boolean) => void
  onSelectRenameQuery: () => void
  onSelectDeleteQuery: () => void
  onSelectShareQuery: () => void
  onSelectDownloadQuery: () => void
}

export const QueryItemActions = ({
  tabInfo,
  open,
  setOpen,
  onSelectRenameQuery,
  onSelectDeleteQuery,
  onSelectShareQuery,
  onSelectDownloadQuery,
}: QueryItemActionsProps) => {
  const { ref } = useParams()
  const router = useRouter()
  const { profile } = useProfile()

  const snap = useSqlEditorStateSnapshot()
  const project = useSelectedProject()

  const { id, name, visibility, content } = tabInfo || {}

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
      toast.error(`Failed to create a personal copy of this query: ${error.message}`)
    }
  }

  return (
    <>
      {IS_PLATFORM ? (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            className="opacity-0 group-hover:opacity-100 group-focus:opacity-100 focus:opacity-100 data-[state=open]:opacity-100"
            asChild
            name="Query actions"
          >
            <Button
              type="text"
              className="px-1 text-lighter data-[state=open]:text-foreground"
              icon={<MoreHorizontal size={14} strokeWidth={2} />}
              onClick={(e) => e.preventDefault()}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start" className="w-52">
            {isSnippetOwner && (
              <DropdownMenuItem onClick={onClickRename} className="flex gap-2">
                <Edit size={14} />
                Rename query
              </DropdownMenuItem>
            )}

            {visibility === 'user' && canCreateSQLSnippet && (
              <DropdownMenuItem onClick={onClickShare} className="flex gap-2">
                <Share size={14} />
                Share query
              </DropdownMenuItem>
            )}
            {visibility === 'project' && canCreateSQLSnippet && (
              <DropdownMenuItem onClick={createPersonalCopy} className="flex gap-2">
                <Copy size={14} />
                Duplicate personal copy
              </DropdownMenuItem>
            )}

            {IS_PLATFORM && (
              <DropdownMenuItem onClick={() => onSelectDownloadQuery()} className="flex gap-2">
                <Download size={14} />
                Download as migration file
              </DropdownMenuItem>
            )}
            {isSnippetOwner && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onClickDelete} className="flex gap-2">
                  <Trash size={14} />
                  Delete query
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
    </>
  )
}
