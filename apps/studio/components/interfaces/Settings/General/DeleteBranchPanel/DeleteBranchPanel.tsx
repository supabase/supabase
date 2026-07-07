import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle, CriticalIcon } from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import { useBranchDeleteMutation } from '@/data/branches/branch-delete-mutation'
import { useBranchUpdateMutation } from '@/data/branches/branch-update-mutation'
import { useBranchesQuery } from '@/data/branches/branches-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTrack } from '@/lib/telemetry/track'

export const DeleteBranchPanel = () => {
  const router = useRouter()
  const track = useTrack()
  const { data: project } = useSelectedProjectQuery()

  const branchRef = project?.ref
  const projectRef = project?.parent_project_ref

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showSwitchToPreviewModal, setShowSwitchToPreviewModal] = useState(false)

  const { can: canDeleteBranches } = useAsyncCheckPermissions(
    PermissionAction.DELETE,
    'preview_branches'
  )

  const { data: branches } = useBranchesQuery({ projectRef })
  const branch = branches?.find((b) => b.project_ref === branchRef)
  const isBranchMetadataReady =
    branchRef !== undefined && projectRef !== undefined && branch !== undefined
  const isPersistentBranch = Boolean(branch?.persistent)

  const { mutate: updateBranch, isPending: isUpdatingBranch } = useBranchUpdateMutation({
    onSuccess: () => {
      toast.success('Successfully switched branch to preview')
      setShowSwitchToPreviewModal(false)
    },
  })

  const { mutate: deleteBranch, isPending: isDeleting } = useBranchDeleteMutation({
    onSuccess: () => {
      toast.success('Successfully deleted branch')
      setShowDeleteModal(false)
      track(
        'branch_delete_button_clicked',
        {
          branchType: isPersistentBranch ? 'persistent' : 'preview',
          origin: 'settings_page',
        },
        { project: projectRef }
      )
      router.push(`/project/${projectRef}/branches`)
    },
  })

  const onClickDelete = () => {
    if (!isBranchMetadataReady) return

    if (isPersistentBranch) {
      setShowSwitchToPreviewModal(true)
    } else {
      setShowDeleteModal(true)
    }
  }

  const onConfirmDelete = () => {
    if (branchRef === undefined || projectRef === undefined || branch === undefined) {
      return console.error('Branch metadata is required')
    }
    deleteBranch({ branchRef, projectRef })
  }

  const onConfirmSwitchToPreview = () => {
    if (branchRef === undefined || projectRef === undefined || branch === undefined) {
      return console.error('Branch metadata is required')
    }
    updateBranch({ branchRef, projectRef, persistent: false })
  }

  if (project === undefined) return null

  return (
    <PageSection id="delete-branch">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Delete branch</PageSectionTitle>
          <PageSectionDescription>
            Permanently remove this branch and its database
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>

      <PageSectionContent>
        <Alert variant="destructive">
          <CriticalIcon />
          <AlertTitle>Deleting this branch will also remove its database.</AlertTitle>
          <AlertDescription>
            Make sure you have made a backup if you want to keep your data. This branch cannot be
            recovered once deleted.
          </AlertDescription>
          <div className="mt-2">
            <ButtonTooltip
              variant="danger"
              disabled={!canDeleteBranches || !isBranchMetadataReady}
              onClick={onClickDelete}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !canDeleteBranches
                    ? 'You need additional permissions to delete this branch'
                    : !isBranchMetadataReady
                      ? 'Branch details are still loading'
                      : undefined,
                },
              }}
            >
              Delete branch
            </ButtonTooltip>
          </div>
        </Alert>
      </PageSectionContent>

      <TextConfirmModal
        variant="warning"
        visible={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={onConfirmDelete}
        loading={isDeleting}
        title="Delete branch"
        confirmLabel="Delete branch"
        confirmPlaceholder="Type in name of branch"
        confirmString={branch?.name ?? ''}
        alert={{
          title: 'You cannot recover this branch once deleted',
        }}
        text={
          <>
            This will delete your database branch{' '}
            <span className="text-bold text-foreground">{branch?.name}</span>.
          </>
        }
      />

      <ConfirmationModal
        variant="warning"
        visible={showSwitchToPreviewModal}
        confirmLabel="Switch to preview"
        title="Branch must be switched to preview before deletion"
        loading={isUpdatingBranch}
        onCancel={() => setShowSwitchToPreviewModal(false)}
        onConfirm={onConfirmSwitchToPreview}
      >
        <p className="text-sm text-foreground-light">
          You must switch the branch "{branch?.name}" to preview before deleting it.
        </p>
      </ConfirmationModal>
    </PageSection>
  )
}
