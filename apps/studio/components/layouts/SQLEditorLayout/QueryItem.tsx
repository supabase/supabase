import { useParams } from 'common'
import { noop } from 'lodash'
import { Eye, Unlock } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import DownloadSnippetModal from 'components/interfaces/SQLEditor/DownloadSnippetModal'
import RenameQueryModal from 'components/interfaces/SQLEditor/RenameQueryModal'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'
import CopyButton from 'components/ui/CopyButton'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import type { SqlSnippet } from 'data/content/sql-snippets-query'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import {
  Checkbox_Shadcn_,
  HoverCardContent_Shadcn_,
  HoverCardTrigger_Shadcn_,
  HoverCard_Shadcn_,
  cn,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { InnerSideMenuItem } from 'ui-patterns/InnerSideMenu'
import { QueryItemActions } from './QueryItemActions'

export interface QueryItemProps {
  tabInfo: SqlSnippet
  isSelected?: boolean
  hasQueriesSelected?: boolean
  onSelectQuery?: (isShiftHeld: boolean) => void
  onDeleteQuery?: (ids: string[]) => void
}

const QueryItem = ({
  tabInfo,
  isSelected = false,
  hasQueriesSelected = false,
  onSelectQuery = noop,
  onDeleteQuery = noop,
}: QueryItemProps) => {
  const [open, setOpen] = useState(false)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isDownloadSnippetModalOpen, setIsDownloadSnippetModalOpen] = useState(false)

  const { ref, id: activeId } = useParams()
  const snap = useSqlEditorStateSnapshot()
  const { id, name, description, content, visibility } = tabInfo || {}
  const isActive = id === activeId
  const activeItemRef = useRef<HTMLElement | null>(null)

  const hideTooltip =
    open ||
    isActive ||
    renameModalOpen ||
    shareModalOpen ||
    deleteModalOpen ||
    isDownloadSnippetModalOpen

  const { mutate: deleteContent, isLoading: isDeleting } = useContentDeleteMutation({
    onSuccess: (data) => {
      onDeleteQuery(data)
    },
    onError: (error, data) => {
      if (error.message.includes('Contents not found')) {
        onDeleteQuery(data.ids)
      } else {
        toast.error(`Failed to delete query: ${error.message}`)
      }
    },
  })

  const onConfirmDelete = async () => {
    if (!ref) return console.error('Project ref is required')
    if (!id) return console.error('Snippet ID is required')
    deleteContent({ projectRef: ref, ids: [id] })
  }

  useEffect(() => {
    // scroll to active item
    if (isActive && activeItemRef.current) {
      // race condition hack
      setTimeout(() => {
        activeItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 0)
    }
  })

  const onConfirmShare = async () => {
    if (id) {
      try {
        snap.shareSnippet(id, 'project')
        return Promise.resolve()
      } catch (error: any) {
        toast.error(`Failed to share query: ${error.message}`)
      }
    }
  }

  return (
    <>
      <HoverCard_Shadcn_ openDelay={200}>
        <HoverCardTrigger_Shadcn_ asChild>
          <InnerSideMenuItem
            title={description || name}
            ref={isActive ? (activeItemRef as React.RefObject<HTMLAnchorElement>) : null}
            href={`/project/${ref}/sql/${id}`}
            key={id}
            className={'flex gap-3 items-center'}
            forceHoverState={open}
            isActive={isActive}
          >
            {visibility === 'user' && (
              <Checkbox_Shadcn_
                className={cn(
                  'transition absolute left-2.5 border-strong',
                  hasQueriesSelected ? '' : 'opacity-0 group-hover:opacity-100'
                )}
                checked={isSelected}
                onCheckedChange={onSelectQuery}
              />
            )}
            <span
              className={cn(
                'transition-all',
                'w-full overflow-hidden truncate',
                hasQueriesSelected && visibility === 'user'
                  ? 'ml-5'
                  : visibility === 'user'
                    ? 'group-hover:ml-5'
                    : '',
                'text-ellipsis truncate'
              )}
            >
              {name}
            </span>
            {!hasQueriesSelected && (
              <QueryItemActions
                tabInfo={tabInfo}
                open={open}
                setOpen={setOpen}
                onSelectDeleteQuery={() => setDeleteModalOpen(true)}
                onSelectRenameQuery={() => setRenameModalOpen(true)}
                onSelectShareQuery={() => setShareModalOpen(true)}
                onSelectDownloadQuery={() => setIsDownloadSnippetModalOpen(true)}
              />
            )}
          </InnerSideMenuItem>
        </HoverCardTrigger_Shadcn_>
        {!hideTooltip && (
          <HoverCardContent_Shadcn_ side="right" align="center" className="w-96" animate="slide-in">
            <>
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
            </>
          </HoverCardContent_Shadcn_>
        )}
      </HoverCard_Shadcn_>
      <RenameQueryModal
        snippet={tabInfo}
        visible={renameModalOpen}
        onCancel={() => setRenameModalOpen(false)}
        onComplete={() => setRenameModalOpen(false)}
      />
      <ConfirmationModal
        title="Confirm to delete query"
        confirmLabel="Delete query"
        confirmLabelLoading="Deleting query"
        size="medium"
        loading={isDeleting}
        visible={deleteModalOpen}
        variant={'destructive'}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={onConfirmDelete}
        alert={
          visibility === 'project'
            ? {
                title: 'This SQL snippet will be lost forever',
                description:
                  'Deleting this query will remove it for all members of the project team.',
              }
            : undefined
        }
      >
        <p className="text-sm">Are you sure you want to delete '{name}'?</p>
      </ConfirmationModal>
      <ConfirmationModal
        title="Confirm sharing query"
        size="medium"
        confirmLabel="Share query"
        confirmLabelLoading="Sharing query"
        visible={shareModalOpen}
        onCancel={() => setShareModalOpen(false)}
        onConfirm={onConfirmShare}
        alert={{
          title: 'This SQL query will become public to all team members',
          description: 'Anyone with access to the project can view it',
        }}
      >
        <ul className="text-sm text-foreground-light space-y-5">
          <li className="flex gap-3">
            <Eye />
            <span>Project members will have read-only access to this query.</span>
          </li>
          <li className="flex gap-3">
            <Unlock />
            <span>Anyone will be able to duplicate it to their personal snippets.</span>
          </li>
        </ul>
      </ConfirmationModal>
      <DownloadSnippetModal
        id={id as string}
        visible={isDownloadSnippetModalOpen}
        onCancel={() => setIsDownloadSnippetModalOpen(false)}
      />
    </>
  )
}

export default QueryItem
