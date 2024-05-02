import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { untitledSnippetTitle } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import { createSqlSnippetSkeleton } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { useFolderCreateMutation } from 'data/content/folder-create-mutation'
import { SqlSnippet, useSqlSnippetsQuery } from 'data/content/sql-snippets-query'
import { useCheckPermissions, useFlag, useSelectedProject } from 'hooks'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { Button } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { InnerSideMenuItem } from 'ui-patterns/InnerSideMenu'
import { SQLEditorNavV1 } from './SQLEditorNavV1'
import { SQLEditorNav as SQLEditorNavV2 } from './SQLEditorNavV2/SQLEditorNav'

const SideBarContent = () => {
  const router = useRouter()
  const { profile } = useProfile()
  const project = useSelectedProject()
  const { ref, id: activeId } = useParams()
  const enableFolders = useFlag('sqlFolderOrganization')

  const [searchText, setSearchText] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedQueries, setSelectedQueries] = useState<string[]>([])

  const snap = useSqlEditorStateSnapshot()
  const { isLoading, isSuccess, isError, error } = useSqlSnippetsQuery(ref, {
    enabled: !enableFolders,
    refetchOnWindowFocus: false,
    staleTime: 300, // 5 minutes
    onSuccess(data) {
      if (ref) snap.setRemoteSnippets(data.snippets, ref)
    },
  })

  const { mutate: createFolder, isLoading: isCreating } = useFolderCreateMutation({
    onSuccess: () => {
      toast.success('Done')
    },
    onError: () => {
      toast.error('Nope')
    },
  })

  const { mutate: deleteContent, isLoading: isDeleting } = useContentDeleteMutation({
    onSuccess: (data) => postDeleteCleanup(data),
    onError: (error, data) => {
      if (error.code === 404 && error.message.includes('Content not found')) {
        postDeleteCleanup(data.ids)
      } else {
        toast.error(`Failed to delete queries: ${error.message}`)
      }
    },
  })

  const postDeleteCleanup = (ids: string[]) => {
    setShowDeleteModal(false)
    setSelectedQueries([])
    if (ids.length > 0) ids.forEach((id) => snap.removeSnippet(id))
    const existingSnippetIds = (snap.orders[ref!] ?? []).filter((x) => !ids.includes(x))
    if (existingSnippetIds.length === 0) {
      router.push(`/project/${ref}/sql/new`)
    } else if (ids.includes(activeId as string)) {
      router.push(`/project/${ref}/sql/${existingSnippetIds[0]}`)
    }
  }

  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const handleNewQuery = async () => {
    if (!ref) return console.error('Project is required')
    if (!profile) return console.error('Profile is required')
    if (!canCreateSQLSnippet) {
      return toast('Your queries will not be saved as you do not have sufficient permissions')
    }

    try {
      const snippet = createSqlSnippetSkeleton({
        id: uuidv4(),
        name: untitledSnippetTitle,
        owner_id: profile?.id,
        project_id: project?.id,
      })

      snap.addSnippet(snippet as SqlSnippet, ref)

      router.push(`/project/${ref}/sql/${snippet.id}`)
      setSearchText('')
    } catch (error: any) {
      toast.error(`Failed to create new query: ${error.message}`)
    }
  }

  const onConfirmDelete = async () => {
    if (!ref) return console.error('Project ref is required')
    deleteContent({ projectRef: ref, ids: selectedQueries })
  }

  return (
    <>
      <div className="mt-6">
        <div className="flex flex-col gap-4">
          <Button
            type="default"
            className="justify-start mx-4"
            onClick={() => handleNewQuery()}
            icon={<Plus className="text-foreground-muted" strokeWidth={1} size={14} />}
          >
            New query
          </Button>

          {/* [Joshen] Temporary */}
          <Button
            type="primary"
            loading={isCreating}
            className="justify-start mx-4"
            onClick={async () => {
              if (ref) createFolder({ projectRef: ref, name: 'test' })
            }}
            icon={<Plus strokeWidth={1} size={14} />}
          >
            Create folder
          </Button>

          <div className="px-2">
            <InnerSideMenuItem
              title="Templates"
              isActive={router.asPath === `/project/${ref}/sql/templates`}
              href={`/project/${ref}/sql/templates`}
            >
              Templates
            </InnerSideMenuItem>
            <InnerSideMenuItem
              title="Quickstarts"
              isActive={router.asPath === `/project/${ref}/sql/quickstarts`}
              href={`/project/${ref}/sql/quickstarts`}
            >
              Quickstarts
            </InnerSideMenuItem>
          </div>

          {enableFolders ? (
            <SQLEditorNavV2 />
          ) : (
            // [Joshen] Eventually needs cleaning up
            <SQLEditorNavV1
              searchText={searchText}
              setSearchText={setSearchText}
              selectedQueries={selectedQueries}
              handleNewQuery={handleNewQuery}
              setSelectedQueries={setSelectedQueries}
              setShowDeleteModal={setShowDeleteModal}
            />
          )}
        </div>
      </div>

      <ConfirmationModal
        title="Confirm to delete query"
        confirmLabel={`Delete ${selectedQueries.length.toLocaleString()} quer${selectedQueries.length > 1 ? 'ies' : 'y'}`}
        confirmLabelLoading="Deleting query"
        size="medium"
        loading={isDeleting}
        visible={showDeleteModal}
        onConfirm={onConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        variant={'destructive'}
        alert={{
          title: 'This action cannot be undone',
          description: 'The selected SQL snippets cannot be recovered once deleted',
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to delete the selected {selectedQueries.length} quer
          {selectedQueries.length > 1 ? 'ies' : 'y'}?
        </p>
      </ConfirmationModal>
    </>
  )
}

export default SideBarContent
