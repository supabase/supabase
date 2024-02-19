import clsx from 'clsx'
import { useParams } from 'common'
import { noop } from 'lodash'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Checkbox,
  Checkbox_Shadcn_,
  IconAlertCircle,
  IconAlertTriangle,
  IconEye,
  IconUnlock,
  Modal,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'

import DownloadSnippetModal from 'components/interfaces/SQLEditor/DownloadSnippetModal'
import RenameQueryModal from 'components/interfaces/SQLEditor/RenameQueryModal'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import CopyButton from 'components/ui/CopyButton'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { SqlSnippet } from 'data/content/sql-snippets-query'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
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
    onSuccess: (data) => onDeleteQuery(data),
    onError: (error, data) => {
      console.log({ error })
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
      <Tooltip_Shadcn_ delayDuration={100}>
        <TooltipTrigger_Shadcn_ asChild>
          <div
            key={id}
            className={clsx(
              'h-7 pl-3 pr-2',
              'flex items-center justify-between rounded-md group relative',
              isActive ? 'bg-surface-300' : 'hover:bg-surface-200'
            )}
            ref={isActive ? (activeItemRef as React.RefObject<HTMLDivElement>) : null}
          >
            {visibility === 'user' && (
              <Checkbox
                className={clsx(
                  'transition absolute left-2.5 top-1 [&>input]:border-foreground-lighter',
                  hasQueriesSelected ? '' : 'opacity-0 group-hover:opacity-100'
                )}
                checked={isSelected}
                onChange={(event) => {
                  onSelectQuery((event.nativeEvent as KeyboardEvent).shiftKey)
                }}
              />
            )}
            <div className="flex items-center justify-between w-full gap-x-2">
              <Link
                title={description || name}
                href={`/project/${ref}/sql/${id}`}
                className={clsx(
                  'w-full overflow-hidden truncate',
                  isActive
                    ? 'text-foreground'
                    : 'text-foreground-light group-hover:text-foreground/80',
                  'text-sm transition-all overflow-hidden text-ellipsis',
                  hasQueriesSelected && visibility === 'user'
                    ? 'ml-5'
                    : visibility === 'user'
                      ? 'group-hover:ml-5'
                      : ''
                )}
              >
                {name}
              </Link>
              {!hasQueriesSelected && (
                <QueryItemActions
                  tabInfo={tabInfo}
                  activeId={activeId}
                  open={open}
                  setOpen={setOpen}
                  onSelectDeleteQuery={() => setDeleteModalOpen(true)}
                  onSelectRenameQuery={() => setRenameModalOpen(true)}
                  onSelectShareQuery={() => setShareModalOpen(true)}
                  onSelectDownloadQuery={() => setIsDownloadSnippetModalOpen(true)}
                />
              )}
            </div>
          </div>
        </TooltipTrigger_Shadcn_>
        {!hideTooltip && (
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
      <RenameQueryModal
        snippet={tabInfo}
        visible={renameModalOpen}
        onCancel={() => setRenameModalOpen(false)}
        onComplete={() => setRenameModalOpen(false)}
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
    </>
  )
}

export default QueryItem
