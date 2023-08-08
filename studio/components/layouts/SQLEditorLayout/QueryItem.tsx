import { PermissionAction } from '@supabase/shared-types/out/constants'
import clsx from 'clsx'
import { useParams } from 'common'
import RenameQueryModal from 'components/interfaces/SQLEditor/RenameQueryModal'
import { createSqlSnippetSkeleton } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { SqlSnippet } from 'data/content/sql-snippets-query'
import { useCheckPermissions, useFlag, useSelectedProject, useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Dropdown,
  IconAlertCircle,
  IconAlertTriangle,
  IconChevronDown,
  IconCopy,
  IconEdit2,
  IconEye,
  IconShare,
  IconTrash,
  IconUnlock,
  Modal,
} from 'ui'

export interface QueryItemProps {
  tabInfo: SqlSnippet
}

const QueryItem = ({ tabInfo }: QueryItemProps) => {
  const { ref, id: activeId } = useParams()
  const { id, name, description } = tabInfo || {}
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
    <div
      key={id}
      className={clsx(
        'flex items-center justify-between rounded-md group',
        isActive && 'text-scale-1200 bg-scale-400 dark:bg-scale-600 -active'
      )}
      ref={isActive ? (activeItemRef as React.RefObject<HTMLDivElement>) : null}
    >
      <Link href={`/project/${ref}/sql/${id}`}>
        <a className="py-1 px-3 w-full">
          <p
            title={description || name}
            className="text-sm text-scale-1100 group-hover:text-scale-1200 transition"
          >
            {name}
          </p>
        </a>
      </Link>
      <div className="pr-3">{<QueryItemActions tabInfo={tabInfo} activeId={activeId} />}</div>
    </div>
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
  const snap = useSqlEditorStateSnapshot()
  const { profile } = useProfile()
  const project = useSelectedProject()
  const sharedSnippetsFeature = useFlag<boolean>('sharedSnippets')
  const { mutate: deleteContent } = useContentDeleteMutation({
    onSuccess(data) {
      if (data.id) snap.removeSnippet(data.id)

      const existingSnippetIds = (snap.orders[ref!] ?? []).filter((x) => x !== id)
      if (existingSnippetIds.length === 0) {
        router.push(`/project/${ref}/sql/new`)
      } else {
        router.push(`/project/${ref}/sql/${existingSnippetIds[0]}`)
      }
    },
    onError(error) {
      ui.setNotification({ category: 'error', message: `Failed to delete query: ${error.message}` })
    },
  })

  const { id, name, visibility, content } = tabInfo || {}
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
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
      router.push(`/project/${ref}/sql/${snippet.id}`)
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to create a personal copy of this query: ${error.message}`,
      })
    }
  }

  return (
    <div className="group [div&>button[data-state='open']>span]:text-scale-900">
      {IS_PLATFORM ? (
        <Dropdown
          side="bottom"
          align="end"
          overlay={
            <>
              <Dropdown.Item onClick={onClickRename} icon={<IconEdit2 size="tiny" />}>
                Rename query
              </Dropdown.Item>
              {sharedSnippetsFeature && visibility === 'user' && canCreateSQLSnippet && (
                <Dropdown.Item onClick={onClickShare} icon={<IconShare size="tiny" />}>
                  Share query
                </Dropdown.Item>
              )}
              {sharedSnippetsFeature && visibility === 'project' && canCreateSQLSnippet && (
                <Dropdown.Item onClick={createPersonalCopy} icon={<IconCopy size="tiny" />}>
                  Create a personal copy
                </Dropdown.Item>
              )}
              <>
                <Dropdown.Separator />
                <Dropdown.Item onClick={onClickDelete} icon={<IconTrash size="tiny" />}>
                  Delete query
                </Dropdown.Item>
              </>
            </>
          }
        >
          <span
            className={clsx(
              'p-0.5 rounded-md',
              isActive
                ? 'text-scale-1100 hover:bg-scale-800'
                : 'text-scale-300 dark:text-scale-200 hover:bg-scale-500 group-hover:text-scale-1100'
            )}
          >
            <IconChevronDown size="tiny" strokeWidth={2} />
          </span>
        </Dropdown>
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
        visible={deleteModalOpen}
        onSelectConfirm={onConfirmDelete}
        onSelectCancel={() => setDeleteModalOpen(false)}
      >
        <Modal.Content>
          <div className="my-6">
            <div className="text-sm text-scale-1100 grid gap-4">
              <div className="grid gap-1">
                {sharedSnippetsFeature && visibility === 'project' && (
                  <Alert_Shadcn_ variant="destructive">
                    <IconAlertCircle strokeWidth={2} />
                    <AlertTitle_Shadcn_>This SQL snippet will be lost forever</AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      Deleting this query will remove it for all members of the project team.
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                )}
                <p className="mt-4">{`Are you sure you want to delete '${name}'?`}</p>
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
            <div className="text-sm text-scale-1100 grid gap-4">
              <div className="grid gap-1">
                <Alert_Shadcn_ variant="warning">
                  <IconAlertTriangle strokeWidth={2} />
                  <AlertTitle_Shadcn_>
                    This SQL query will become public to all team members
                  </AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    Anyone with access to the project can edit or delete this query.
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
                <ul className="mt-4 space-y-5">
                  <li className="flex gap-3">
                    <IconEye />
                    <span>Anyone with access to this project will be able to view it.</span>
                  </li>
                  <li className="flex gap-3">
                    <IconUnlock />
                    <span>Anyone will be able to modify or delete it.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Modal.Content>
      </ConfirmationModal>
    </div>
  )
})
