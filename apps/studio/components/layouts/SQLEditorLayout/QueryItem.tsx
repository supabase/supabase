import clsx from 'clsx'
import { useParams } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
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
}

const QueryItem = ({ tabInfo }: QueryItemProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isDownloadSnippetModalOpen, setIsDownloadSnippetModalOpen] = useState(false)

  const { ref, id: activeId } = useParams()
  const snap = useSqlEditorStateSnapshot()
  const { id, name, description, content } = tabInfo || {}
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
    onSuccess(data) {
      if (data.length > 0) snap.removeSnippet(data[0])

      const existingSnippetIds = (snap.orders[ref!] ?? []).filter((x) => x !== id)
      if (existingSnippetIds.length === 0) {
        router.push(`/project/${ref}/sql/new`)
      } else {
        router.push(`/project/${ref}/sql/${existingSnippetIds[0]}`)
      }
    },
    onError(error, data) {
      if (error.code === 404 && error.message.includes('Content not found')) {
        if (data.ids) snap.removeSnippet(data.ids[0])
        const existingSnippetIds = (snap.orders[ref!] ?? []).filter((x) => x !== id)
        if (existingSnippetIds.length === 0) {
          router.push(`/project/${ref}/sql/new`)
        } else {
          router.push(`/project/${ref}/sql/${existingSnippetIds[0]}`)
        }
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
            <div className="pr-1">
              {
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
              }
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
                {tabInfo.visibility === 'project' && (
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
