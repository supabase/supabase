import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { partition } from 'lodash'
import {
  Clock,
  ExternalLink,
  Infinity,
  MoreVertical,
  Pencil,
  RefreshCw,
  Shield,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useIsBranching2Enabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { DropdownMenuItemTooltip } from 'components/ui/DropdownMenuItemTooltip'
import { TextConfirmModal } from 'components/ui/TextConfirmModalWrapper'
import { useBranchQuery } from 'data/branches/branch-query'
import { useBranchResetMutation } from 'data/branches/branch-reset-mutation'
import { useBranchRestoreMutation } from 'data/branches/branch-restore-mutation'
import { useBranchUpdateMutation } from 'data/branches/branch-update-mutation'
import type { Branch } from 'data/branches/branches-query'
import { branchKeys } from 'data/branches/keys'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from 'lib/constants'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import { BranchLoader, BranchManagementSection, BranchRow, BranchRowLoader } from './BranchPanels'
import { EditBranchModal } from './EditBranchModal'
import { PreviewBranchesEmptyState } from './EmptyStates'

interface OverviewProps {
  isGithubConnected: boolean
  isLoading: boolean
  isSuccess: boolean
  repo: string
  mainBranch: Branch
  previewBranches: Branch[]
  onSelectCreateBranch: () => void
  onSelectDeleteBranch: (branch: Branch) => void
  generateCreatePullRequestURL: (branchName?: string) => string
}

export const Overview = ({
  isGithubConnected,
  isLoading,
  isSuccess,
  repo,
  mainBranch,
  previewBranches,
  onSelectCreateBranch,
  onSelectDeleteBranch,
  generateCreatePullRequestURL,
}: OverviewProps) => {
  const [scheduledForDeletionBranches, aliveBranches] = partition(
    previewBranches,
    (branch) => branch.deletion_scheduled_at !== undefined
  )
  const [persistentBranches, ephemeralBranches] = partition(
    aliveBranches,
    (branch) => branch.persistent
  )
  const { ref: projectRef } = useParams()
  const { data: selectedOrg } = useSelectedOrganizationQuery()

  const { hasAccess: hasAccessToPersistentBranching, isLoading: isLoadingEntitlement } =
    useCheckEntitlements('branching_persistent')

  return (
    <>
      <BranchManagementSection header="Production branch">
        {isLoading && <BranchRowLoader />}
        {isSuccess && mainBranch !== undefined && (
          <BranchRow
            branch={mainBranch}
            isGithubConnected={isGithubConnected}
            label={
              <div className="flex items-center gap-x-2">
                <Shield size={14} strokeWidth={1.5} className="text-warning" />
                {mainBranch.name}
              </div>
            }
            repo={repo}
            rowActions={<MainBranchActions branch={mainBranch} repo={repo} />}
          />
        )}
        {isSuccess && mainBranch === undefined && (
          <div className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-100">
            <Link href={`/project/${projectRef}`} className="text-foreground block w-full">
              <div className="flex items-center gap-x-3">
                <Shield size={14} strokeWidth={1.5} className="text-warning" />
                main
              </div>
            </Link>
          </div>
        )}
      </BranchManagementSection>

      {/* Persistent Branches Section */}
      <BranchManagementSection header="Persistent branches">
        {(isLoading || isLoadingEntitlement) && <BranchLoader />}
        {isSuccess &&
          !isLoadingEntitlement &&
          !hasAccessToPersistentBranching &&
          IS_PLATFORM &&
          persistentBranches.length === 0 && (
            <div className="px-6 py-10 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm">Upgrade to unlock persistent branches</p>
                <p className="text-sm text-foreground-lighter text-balance">
                  Persistent branches are long-lived, cannot be reset, and are ideal for staging
                  environments.
                </p>
              </div>
              <Button type="primary" asChild>
                <Link href={`/org/${selectedOrg?.slug}/billing?panel=subscriptionPlan`}>
                  Upgrade
                </Link>
              </Button>
            </div>
          )}
        {isSuccess &&
          !isLoadingEntitlement &&
          hasAccessToPersistentBranching &&
          persistentBranches.length === 0 && (
            <div className="flex items-center flex-col gap-0.5 justify-center w-full py-10">
              <p>No persistent branches</p>
              <p className="text-foreground-lighter text-center text-balance">
                Persistent branches are long-lived, cannot be reset, and are ideal for staging
                environments.
              </p>
            </div>
          )}
        {isSuccess &&
          !isLoadingEntitlement &&
          persistentBranches.map((branch) => {
            return (
              <BranchRow
                isGithubConnected={isGithubConnected}
                key={branch.id}
                repo={repo}
                branch={branch}
                rowActions={
                  <PreviewBranchActions
                    branch={branch}
                    repo={repo}
                    onSelectDeleteBranch={() => onSelectDeleteBranch(branch)}
                    generateCreatePullRequestURL={generateCreatePullRequestURL}
                  />
                }
              />
            )
          })}
      </BranchManagementSection>

      {/* Ephemeral/Preview Branches Section */}
      <BranchManagementSection header="Preview branches">
        {isLoading && <BranchLoader />}
        {isSuccess && ephemeralBranches.length === 0 && (
          <PreviewBranchesEmptyState onSelectCreateBranch={onSelectCreateBranch} />
        )}
        {isSuccess &&
          ephemeralBranches.map((branch) => {
            return (
              <BranchRow
                isGithubConnected={isGithubConnected}
                key={branch.id}
                repo={repo}
                branch={branch}
                rowActions={
                  <PreviewBranchActions
                    branch={branch}
                    repo={repo}
                    onSelectDeleteBranch={() => onSelectDeleteBranch(branch)}
                    generateCreatePullRequestURL={generateCreatePullRequestURL}
                  />
                }
              />
            )
          })}
      </BranchManagementSection>
      {/* Scheduled for deletion branches section */}
      <BranchManagementSection header="Scheduled for deletion branches">
        {isLoading && <BranchLoader />}
        {isSuccess && scheduledForDeletionBranches.length === 0 && (
          <div className="flex items-center flex-col gap-0.5 justify-center w-full py-10">
            <p className="text-foreground-lighter">No branches scheduled for deletion</p>
          </div>
        )}
        {isSuccess &&
          scheduledForDeletionBranches.map((branch) => {
            return (
              <BranchRow
                isGithubConnected={isGithubConnected}
                key={branch.id}
                repo={repo}
                branch={branch}
                rowActions={
                  <PreviewBranchActions
                    branch={branch}
                    repo={repo}
                    // If a scheduled for deletion branch is deleted, we force the deletion
                    onSelectDeleteBranch={() => onSelectDeleteBranch(branch)}
                    generateCreatePullRequestURL={generateCreatePullRequestURL}
                  />
                }
              />
            )
          })}
      </BranchManagementSection>
    </>
  )
}

// Row actions for preview branches (non-main)
const PreviewBranchActions = ({
  branch,
  onSelectDeleteBranch,
  generateCreatePullRequestURL,
}: {
  branch: Branch
  repo: string
  onSelectDeleteBranch: () => void
  generateCreatePullRequestURL: (branchName?: string) => string
}) => {
  const gitlessBranching = useIsBranching2Enabled()
  const queryClient = useQueryClient()
  const { project_ref: branchRef, parent_project_ref: projectRef } = branch

  const { can: canDeleteBranches } = useAsyncCheckPermissions(
    PermissionAction.DELETE,
    'preview_branches'
  )
  const { can: canUpdateBranches } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'preview_branches'
  )
  // If user can update branches, they can restore branches
  const canRestoreBranches = canUpdateBranches

  const { data } = useBranchQuery({ projectRef, branchRef })
  const isBranchActiveHealthy = data?.status === 'ACTIVE_HEALTHY'
  const isPersistentBranch = branch.persistent

  const { hasAccess: hasAccessToPersistentBranching } = useCheckEntitlements('branching_persistent')

  const [showConfirmResetModal, setShowConfirmResetModal] = useState(false)
  const [showBranchModeSwitch, setShowBranchModeSwitch] = useState(false)
  const [
    showPersistentBranchDeleteConfirmationModal,
    setShowPersistentBranchDeleteConfirmationModal,
  ] = useState(false)
  const [showEditBranchModal, setShowEditBranchModal] = useState(false)

  const { mutate: resetBranch, isPending: isResetting } = useBranchResetMutation({
    onSuccess() {
      toast.success('Success! Please allow a few seconds for the branch to reset.')
      setShowConfirmResetModal(false)
    },
  })

  const { mutate: updateBranch, isPending: isUpdatingBranch } = useBranchUpdateMutation({
    onSuccess() {
      toast.success('Successfully updated branch')
      setShowBranchModeSwitch(false)
      if (projectRef) {
        queryClient.invalidateQueries({ queryKey: branchKeys.list(projectRef) })
      }
    },
  })
  const { mutate: restoreBranch } = useBranchRestoreMutation({
    onSuccess() {
      toast.success('Success! Please allow a few minutes for the branch to restore.')
      setShowBranchModeSwitch(false)
    },
  })

  const onRestoreBranch = () => {
    restoreBranch({ branchRef, projectRef })
  }

  const onConfirmReset = () => {
    resetBranch({ branchRef, projectRef })
  }

  const onTogglePersistent = () => {
    updateBranch({ branchRef, projectRef, persistent: !branch.persistent })
  }

  const onDeleteBranch = (e: Event | React.MouseEvent<HTMLDivElement>) => {
    if (isPersistentBranch) {
      setShowPersistentBranchDeleteConfirmationModal(true)
    } else {
      e.stopPropagation()
      onSelectDeleteBranch()
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="text"
            icon={<MoreVertical />}
            className="px-1"
            onClick={(e) => e.stopPropagation()}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" side="bottom" align="end">
          {/* Edit Branch (gitless) */}
          {gitlessBranching && (
            <DropdownMenuItemTooltip
              className="gap-x-2"
              disabled={!canUpdateBranches || !isBranchActiveHealthy || isUpdatingBranch}
              onSelect={(e) => {
                e.stopPropagation()
                setShowEditBranchModal(true)
              }}
              onClick={(e) => {
                e.stopPropagation()
                setShowEditBranchModal(true)
              }}
              tooltip={{
                content: {
                  side: 'left',
                  text: !canUpdateBranches
                    ? 'You need additional permissions to edit branches'
                    : !isBranchActiveHealthy
                      ? 'Branch is still initializing. Please wait for it to become healthy before editing.'
                      : undefined,
                },
              }}
            >
              <Pencil size={14} /> Edit branch
            </DropdownMenuItemTooltip>
          )}

          {!branch.deletion_scheduled_at && (
            <DropdownMenuItemTooltip
              className="gap-x-2"
              disabled={isResetting || !isBranchActiveHealthy}
              onSelect={(e) => {
                e.stopPropagation()
                setShowConfirmResetModal(true)
              }}
              onClick={(e) => {
                e.stopPropagation()
                setShowConfirmResetModal(true)
              }}
              tooltip={{
                content: {
                  side: 'left',
                  text: !isBranchActiveHealthy
                    ? 'Branch is still initializing. Please wait for it to become healthy before resetting.'
                    : undefined,
                },
              }}
            >
              <RefreshCw size={14} /> Reset branch
            </DropdownMenuItemTooltip>
          )}

          {!branch.deletion_scheduled_at && (
            <DropdownMenuItemTooltip
              className="gap-x-2"
              disabled={
                !isBranchActiveHealthy || (!branch.persistent && !hasAccessToPersistentBranching)
              }
              onSelect={(e) => {
                e.stopPropagation()
                setShowBranchModeSwitch(true)
              }}
              onClick={(e) => {
                e.stopPropagation()
                setShowBranchModeSwitch(true)
              }}
              tooltip={{
                content: {
                  side: 'left',
                  text: !isBranchActiveHealthy
                    ? 'Branch is still initializing. Please wait for it to become healthy before switching.'
                    : !branch.persistent && !hasAccessToPersistentBranching
                      ? 'Upgrade your plan to access persistent branches'
                      : undefined,
                },
              }}
            >
              {branch.persistent ? (
                <>
                  <Clock size={14} /> Switch to preview
                </>
              ) : (
                <>
                  <Infinity size={14} className="scale-110" /> Switch to persistent
                </>
              )}
            </DropdownMenuItemTooltip>
          )}

          {/* Create PR if applicable */}
          {branch.git_branch && branch.pr_number === undefined && (
            <DropdownMenuItem asChild className="gap-x-2">
              <a
                target="_blank"
                rel="noreferrer"
                href={generateCreatePullRequestURL(branch.git_branch)}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={14} /> Create pull request
              </a>
            </DropdownMenuItem>
          )}
          {branch.deletion_scheduled_at && (
            <DropdownMenuItemTooltip
              className="gap-x-2"
              disabled={!canRestoreBranches || branch.preview_project_status !== 'INACTIVE'}
              onSelect={(e) => {
                e.stopPropagation()
                onRestoreBranch()
              }}
              onClick={(e) => {
                e.stopPropagation()
                onRestoreBranch()
              }}
              tooltip={{
                content: {
                  side: 'left',
                  text: !canRestoreBranches
                    ? 'You need additional permissions to restore branches'
                    : branch.preview_project_status !== 'INACTIVE'
                      ? 'Preview project is not fully paused or already coming up. Please wait for it to become fully paused before restoring.'
                      : undefined,
                },
              }}
            >
              <Clock size={14} /> Restore branch
            </DropdownMenuItemTooltip>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItemTooltip
            className="gap-x-2"
            disabled={!canDeleteBranches}
            onSelect={onDeleteBranch}
            onClick={onDeleteBranch}
            tooltip={{
              content: {
                side: 'left',
                text: !canDeleteBranches
                  ? 'You need additional permissions to delete branches'
                  : undefined,
              },
            }}
          >
            <Trash2 size={14} /> Delete branch
          </DropdownMenuItemTooltip>
        </DropdownMenuContent>
      </DropdownMenu>

      <TextConfirmModal
        variant="warning"
        visible={showConfirmResetModal}
        onCancel={() => setShowConfirmResetModal(false)}
        onConfirm={onConfirmReset}
        loading={isResetting}
        title="Reset branch"
        confirmLabel="Reset branch"
        confirmPlaceholder="Type in name of branch"
        confirmString={branch?.name ?? ''}
        alert={{
          title: `Are you sure you want to reset the "${branch.name}" branch? All data will be deleted.`,
        }}
      />

      <ConfirmationModal
        variant="default"
        visible={showBranchModeSwitch}
        confirmLabel={branch.persistent ? 'Switch to preview' : 'Switch to persistent'}
        title="Confirm branch mode switch"
        loading={isUpdatingBranch}
        onCancel={() => setShowBranchModeSwitch(false)}
        onConfirm={onTogglePersistent}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to switch the branch "{branch.name}" to{' '}
          {branch.persistent ? 'preview' : 'persistent'}?
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        variant="warning"
        visible={showPersistentBranchDeleteConfirmationModal}
        confirmLabel={'Switch to preview'}
        title="Branch must be switched to preview before deletion"
        loading={isUpdatingBranch}
        onCancel={() => setShowPersistentBranchDeleteConfirmationModal(false)}
        onConfirm={onTogglePersistent}
      >
        <p className="text-sm text-foreground-light">
          You must switch the branch "{branch.name}" to preview before deleting it.
        </p>
      </ConfirmationModal>

      <EditBranchModal
        branch={branch}
        visible={showEditBranchModal}
        onClose={() => setShowEditBranchModal(false)}
      />
    </>
  )
}

// Actions for main (production) branch
const MainBranchActions = ({ branch, repo }: { branch: Branch; repo: string }) => {
  const { ref: projectRef } = useParams()
  const { can: canUpdateBranches } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'preview_branches'
  )
  const [showEditBranchModal, setShowEditBranchModal] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="text" icon={<MoreVertical />} className="px-1" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" side="bottom" align="end">
          {repo ? (
            <Link passHref href={`/project/${projectRef}/settings/integrations`}>
              <DropdownMenuItem asChild className="gap-x-2">
                <a>Change production branch</a>
              </DropdownMenuItem>
            </Link>
          ) : (
            <DropdownMenuItem
              className="gap-x-2"
              disabled={!canUpdateBranches}
              onSelect={() => setShowEditBranchModal(true)}
              onClick={() => setShowEditBranchModal(true)}
            >
              <Pencil size={14} /> Edit Branch
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditBranchModal
        branch={branch}
        visible={showEditBranchModal}
        onClose={() => setShowEditBranchModal(false)}
      />
    </>
  )
}
