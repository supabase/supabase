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
import { DropdownMenuItemTooltip } from 'components/ui/DropdownMenuItemTooltip'
import { useBranchQuery } from 'data/branches/branch-query'
import { useBranchResetMutation } from 'data/branches/branch-reset-mutation'
import { useBranchUpdateMutation } from 'data/branches/branch-update-mutation'
import type { Branch } from 'data/branches/branches-query'
import { branchKeys } from 'data/branches/keys'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useFlag } from 'hooks/ui/useFlag'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { BranchLoader, BranchManagementSection, BranchRow, BranchRowLoader } from './BranchPanels'
import { EditBranchModal } from './EditBranchModal'
import { PreviewBranchesEmptyState } from './EmptyStates'

interface OverviewProps {
  isLoading: boolean
  isSuccess: boolean
  repo: string
  mainBranch: Branch
  previewBranches: Branch[]
  onSelectCreateBranch: () => void
  onSelectDeleteBranch: (branch: Branch) => void
  generateCreatePullRequestURL: (branchName?: string) => string
  showProductionBranch?: boolean
}

export const Overview = ({
  isLoading,
  isSuccess,
  repo,
  mainBranch,
  previewBranches,
  onSelectCreateBranch,
  onSelectDeleteBranch,
  generateCreatePullRequestURL,
  showProductionBranch = true,
}: OverviewProps) => {
  const [persistentBranches, ephemeralBranches] = partition(
    previewBranches,
    (branch) => branch.persistent
  )

  return (
    <>
      {showProductionBranch && (
        <BranchManagementSection header="Production branch">
          {isLoading && <BranchRowLoader />}
          {isSuccess && mainBranch !== undefined && (
            <BranchRow
              branch={mainBranch}
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
        </BranchManagementSection>
      )}

      {/* Persistent Branches Section */}
      <BranchManagementSection header="Persistent branches">
        {isLoading && <BranchLoader />}
        {isSuccess && persistentBranches.length === 0 && (
          <div className="flex items-center flex-col justify-center w-full py-10">
            <p>No persistent branches</p>
            <p className="text-foreground-light">
              Persistent branches are long-lived and not automatically deleted.
            </p>
          </div>
        )}
        {isSuccess &&
          persistentBranches.map((branch) => {
            return (
              <BranchRow
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
  const gitlessBranching = useFlag('gitlessBranching')
  const queryClient = useQueryClient()
  const projectRef = branch.parent_project_ref ?? branch.project_ref

  const canDeleteBranches = useCheckPermissions(PermissionAction.DELETE, 'preview_branches')
  const canUpdateBranches = useCheckPermissions(PermissionAction.UPDATE, 'preview_branches')

  const { data } = useBranchQuery({ projectRef, id: branch.id })
  const isBranchActiveHealthy = data?.status === 'ACTIVE_HEALTHY'

  const [showConfirmResetModal, setShowConfirmResetModal] = useState(false)
  const [showBranchModeSwitch, setShowBranchModeSwitch] = useState(false)
  const [showEditBranchModal, setShowEditBranchModal] = useState(false)

  const { mutate: resetBranch, isLoading: isResetting } = useBranchResetMutation({
    onSuccess() {
      toast.success('Success! Please allow a few seconds for the branch to reset.')
      setShowConfirmResetModal(false)
    },
  })

  const { mutate: updateBranch, isLoading: isUpdatingBranch } = useBranchUpdateMutation({
    onSuccess() {
      toast.success('Successfully updated branch')
      setShowBranchModeSwitch(false)
      if (projectRef) {
        queryClient.invalidateQueries({ queryKey: branchKeys.list(projectRef) })
      }
    },
  })

  const onConfirmReset = () => {
    if (!projectRef) return
    resetBranch({ id: branch.id, projectRef })
  }

  const onTogglePersistent = () => {
    if (!projectRef) return
    updateBranch({ id: branch.id, projectRef, persistent: !branch.persistent })
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

          <DropdownMenuItemTooltip
            className="gap-x-2"
            disabled={!isBranchActiveHealthy}
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

          <DropdownMenuItemTooltip
            className="gap-x-2"
            disabled={!canDeleteBranches}
            onSelect={(e) => {
              e.stopPropagation()
              onSelectDeleteBranch()
            }}
            onClick={(e) => {
              e.stopPropagation()
              onSelectDeleteBranch()
            }}
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
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmationModal
        variant="destructive"
        visible={showConfirmResetModal}
        confirmLabel="Reset branch"
        title="Confirm branch reset"
        loading={isResetting}
        onCancel={() => setShowConfirmResetModal(false)}
        onConfirm={onConfirmReset}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to reset the "{branch.name}" branch? All data will be deleted.
        </p>
      </ConfirmationModal>

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
  const canUpdateBranches = useCheckPermissions(PermissionAction.UPDATE, 'preview_branches')
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
