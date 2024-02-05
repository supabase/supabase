import { PermissionAction } from '@supabase/shared-types/out/constants'
import clsx from 'clsx'
import { useParams } from 'common'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconAlertCircle,
  IconAlertTriangle,
  IconChevronDown,
  IconCopy,
  IconDownload,
  IconEdit2,
  IconEye,
  IconShare,
  IconTrash,
  IconUnlock,
  Modal,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'

import DownloadSnippetModal from 'components/interfaces/SQLEditor/DownloadSnippetModal'
import RenameQueryModal from 'components/interfaces/SQLEditor/RenameQueryModal'
import { createSqlSnippetSkeleton } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import CopyButton from 'components/ui/CopyButton'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { SqlSnippet } from 'data/content/sql-snippets-query'
import { useCheckPermissions, useSelectedProject, useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'

export interface QueryItemProps {
  tabInfo: SqlSnippet
}

const QueryItem = ({ tabInfo }: QueryItemProps) => {
  const { ref, id: activeId } = useParams()
  const { id, name, description, content } = tabInfo || {}
  const isActive = id === activeId
  const activeItemRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // scroll to active item
    if (isActive && activeItemRef.current) {
      // race condition hack
      setTimeout(() => {
        activeItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 0)
    }
  })

  return (
    <Tooltip_Shadcn_ delayDuration={100}>
      <TooltipTrigger_Shadcn_ asChild>
        <div
          key={id}
          className={clsx(
            'flex items-center justify-between rounded-md group',
            isActive ? 'bg-surface-300' : 'hover:bg-surface-200'
          )}
          ref={isActive ? (activeItemRef as React.RefObject<HTMLDivElement>) : null}
        >
          <Link href={`/project/${ref}/sql/${id}`} className="py-1 px-3 w-full overflow-hidden">
            <p
              title={description || name}
              className={clsx(
                isActive
                  ? 'text-foreground'
                  : 'text-foreground-light group-hover:text-foreground/80',
                'text-sm transition overflow-hidden text-ellipsis'
              )}
            >
              {name}
            </p>
          </Link>
          <div className="pr-1">{<QueryItemActions tabInfo={tabInfo} activeId={activeId} />}</div>
        </div>
      </TooltipTrigger_Shadcn_>
      {!isActive && (
        <TooltipContent_Shadcn_
          side="right"
          align="start"
          className="w-96 flex flex-col gap-y-2 py-3 -translate-y-[4px]"
        >
          <p className="text-xs">Query preview:</p>
          <div className="bg-surface-300 py-2 px-3 rounded relative">
            {content.sql.trim() ? (
              <SimpleCodeBlock
                showCopy={false}
                className="sql"
                parentClassName="!p-0 [&>div>span]:text-xs [&>div>span]:tracking-tighter"
              >
                {content.sql.replaceAll('\n', ' ').replaceAll(/\s+/g, ' ').slice(0, 43) +
                  `${content.sql.length > 43 ? '...' : ''}`}
              </SimpleCodeBlock>
            ) : (
              <p className="text-xs text-foreground-lighter">This query is empty</p>
            )}
            {content.sql.trim() && (
              <CopyButton
                iconOnly
                type="default"
                className="px-1 absolute top-1.5 right-1.5"
                text={content.sql}
              />
            )}
          </div>
        </TooltipContent_Shadcn_>
      )}
    </Tooltip_Shadcn_>
  )
}

export default QueryItem

interface QueryItemActionsProps {
  tabInfo: SqlSnippet
  activeId: string | undefined
}

const QueryItemActions = observer(({ tabInfo, activeId }: QueryItemActionsProps) => {
  const { ui } = useStore()
  const { ref } = useParams()
  const router = useRouter()
  const { profile } = useProfile()

  const snap = useSqlEditorStateSnapshot()
  const project = useSelectedProject()

  const { id: snippetID } = tabInfo || {}
  const snippet =
    snippetID !== undefined && snap.snippets && snap.snippets[snippetID] !== undefined
      ? snap.snippets[snippetID]
      : null

  const isSnippetOwner = profile?.id === snippet?.snippet.owner_id

  const { mutate: deleteContent, isLoading: isDeleting } = useContentDeleteMutation({
    onSuccess(data) {
      if (data.id) snap.removeSnippet(data.id)

      const existingSnippetIds = (snap.orders[ref!] ?? []).filter((x) => x !== id)
      if (existingSnippetIds.length === 0) {
        router.push(`/project/${ref}/sql/new`)
      } else {
        router.push(`/project/${ref}/sql/${existingSnippetIds[0]}`)
      }
    },
    onError(error, data) {
      if (error.code === 404 && error.message.includes('Content not found')) {
        if (data.id) snap.removeSnippet(data.id)
        const existingSnippetIds = (snap.orders[ref!] ?? []).filter((x) => x !== id)
        if (existingSnippetIds.length === 0) {
          router.push(`/project/${ref}/sql/new`)
        } else {
          router.push(`/project/${ref}/sql/${existingSnippetIds[0]}`)
        }
      } else {
        ui.setNotification({
          category: 'error',
          message: `Failed to delete query: ${error.message}`,
        })
      }
    },
  })

  const { id, name, visibility, content } = tabInfo || {}
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isDownloadSnippetModalOpen, setIsDownloadSnippetModalOpen] = useState(false)
  const isActive = id === activeId

  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const onCloseRenameModal = () => {
    setRenameModalOpen(false)
  }

  const onClickRename = (e: any) => {
    e.stopPropagation()
    setRenameModalOpen(true)
  }

  const onClickShare = (e: any) => {
    e.stopPropagation()
    setShareModalOpen(true)
  }

  const onClickDelete = (e: any) => {
    e.stopPropagation()
    setDeleteModalOpen(true)
  }

  const onConfirmShare = async () => {
    if (id) {
      try {
        snap.shareSnippet(id, 'project')
        return Promise.resolve()
      } catch (error: any) {
        ui.setNotification({
          error,
          category: 'error',
          message: `Failed to share query: ${error.message}`,
        })
      }
    }
  }

  const onConfirmDelete = async () => {
    if (!ref) return console.error('Project ref is required')
    if (!id) return console.error('Snippet ID is required')
    deleteContent({ projectRef: ref, id })
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <span
              className={clsx(
                'rounded p-1',
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
              <DropdownMenuItem
                onClick={() => setIsDownloadSnippetModalOpen(!isDownloadSnippetModalOpen)}
                className="space-x-2"
              >
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
          <span></span>
        </Button>
      )}
      <RenameQueryModal
        snippet={tabInfo}
        visible={renameModalOpen}
        onCancel={onCloseRenameModal}
        onComplete={onCloseRenameModal}
      />
      <ConfirmationModal
        header="Confirm to delete query"
        buttonLabel="Delete query"
        buttonLoadingLabel="Deleting query"
        size="medium"
        loading={isDeleting}
        visible={deleteModalOpen}
        onSelectConfirm={onConfirmDelete}
        onSelectCancel={() => setDeleteModalOpen(false)}
      >
        <Modal.Content>
          <div className="my-6">
            <div className="text-sm text-foreground-light grid gap-4">
              <div className="grid gap-1">
                {visibility === 'project' && (
                  <Alert_Shadcn_ variant="destructive">
                    <IconAlertCircle strokeWidth={2} />
                    <AlertTitle_Shadcn_>This SQL snippet will be lost forever</AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      Deleting this query will remove it for all members of the project team.
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                )}
                <p>Are you sure you want to delete '{name}'?</p>
              </div>
            </div>
          </div>
        </Modal.Content>
      </ConfirmationModal>
      <ConfirmationModal
        header="Confirm sharing query"
        size="medium"
        buttonLabel="Share query"
        buttonLoadingLabel="Sharing query"
        visible={shareModalOpen}
        onSelectConfirm={onConfirmShare}
        onSelectCancel={() => setShareModalOpen(false)}
      >
        <Modal.Content>
          <div className="my-6">
            <div className="text-sm text-foreground-light grid gap-4">
              <div className="grid gap-1">
                <Alert_Shadcn_ variant="warning">
                  <IconAlertTriangle strokeWidth={2} />
                  <AlertTitle_Shadcn_>
                    This SQL query will become public to all team members
                  </AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    Anyone with access to the project can view it
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
                <ul className="mt-4 space-y-5">
                  <li className="flex gap-3">
                    <IconEye />
                    <span>Project members will have read-only access to this query.</span>
                  </li>
                  <li className="flex gap-3">
                    <IconUnlock />
                    <span>Anyone will be able to duplicate it to their personal snippets.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Modal.Content>
      </ConfirmationModal>
      <DownloadSnippetModal
        id={id as string}
        visible={isDownloadSnippetModalOpen}
        onCancel={() => setIsDownloadSnippetModalOpen(false)}
      />
    </div>
  )
})
