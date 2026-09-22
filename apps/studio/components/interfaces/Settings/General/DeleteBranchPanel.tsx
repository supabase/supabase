import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle, CriticalIcon } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { DeleteBranchModal } from '../../BranchManagement/DeleteBranchModal'
import { SwitchToPreviewModal } from '../../BranchManagement/SwitchToPreviewModal'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
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

  const onClickDelete = () => {
    if (!isBranchMetadataReady) return

    if (isPersistentBranch) {
      setShowSwitchToPreviewModal(true)
    } else {
      setShowDeleteModal(true)
    }
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
            Make sure you have made a backup if you want to keep your data.
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

      <DeleteBranchModal
        branch={branch}
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={() => {
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
        }}
      />

      <SwitchToPreviewModal
        branch={branch}
        open={showSwitchToPreviewModal}
        onClose={() => setShowSwitchToPreviewModal(false)}
      />
    </PageSection>
  )
}
