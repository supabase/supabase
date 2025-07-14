import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from 'ui'
import {
  MoreVertical,
  Trash2,
  ExternalLink,
  RefreshCw,
  Clock,
  Infinity,
  Pencil,
  Shield,
} from 'lucide-react'
import { useParams } from 'common'
import { useBranchResetMutation } from 'data/branches/branch-reset-mutation'
import { useBranchUpdateMutation } from 'data/branches/branch-update-mutation'
import { useBranchQuery } from 'data/branches/branch-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useFlag } from 'hooks/ui/useFlag'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { EditBranchModal } from './EditBranchModal'
import { Tooltip, TooltipTrigger, TooltipContent } from 'ui'
import { toast } from 'sonner'
import Link from 'next/link'

import type { Branch } from 'data/branches/branches-query'
import { BranchLoader, BranchManagementSection, BranchRow, BranchRowLoader } from './BranchPanels'
import { PreviewBranchesEmptyState } from './EmptyStates'
import { useState } from 'react'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { branchKeys } from 'data/branches/keys'

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
  const persistentBranches = previewBranches.filter((branch) => branch.persistent)
  const ephemeralBranches = previewBranches.filter((branch) => !branch.persistent)

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

  const { data } = useBranchQuery({
    projectRef,
    id: branch.id,
  })
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
          {/* Reset Branch */}
          <Tooltip>
            <TooltipTrigger asChild={isBranchActiveHealthy} className="w-full">
              <DropdownMenuItem
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
              >
                <RefreshCw size={14} /> Reset Branch
              </DropdownMenuItem>
            </TooltipTrigger>
            {!isBranchActiveHealthy && (
              <TooltipContent side="left">
                Branch is still initializing. Please wait for it to become healthy before resetting
              </TooltipContent>
            )}
          </Tooltip>

          {/* Switch persistent/ephemeral */}
          <Tooltip>
            <TooltipTrigger asChild={isBranchActiveHealthy} className="w-full">
              <DropdownMenuItem
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
              </DropdownMenuItem>
            </TooltipTrigger>
            {!isBranchActiveHealthy && (
              <TooltipContent side="left">
                Branch is still initializing. Please wait for it to become healthy before switching
              </TooltipContent>
            )}
          </Tooltip>

          {/* Edit Branch (gitless) */}
          {gitlessBranching && (
            <Tooltip>
              <TooltipTrigger
                asChild={canUpdateBranches && isBranchActiveHealthy}
                className="w-full"
              >
                <DropdownMenuItem
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
                >
                  <Pencil size={14} /> Edit Branch
                </DropdownMenuItem>
              </TooltipTrigger>
              {(!canUpdateBranches || !isBranchActiveHealthy) && (
                <TooltipContent side="left">
                  {!canUpdateBranches
                    ? 'You need additional permissions to edit branches'
                    : 'Branch is still initializing. Wait until healthy.'}
                </TooltipContent>
              )}
            </Tooltip>
          )}

          {/* Delete Branch */}
          <Tooltip>
            <TooltipTrigger asChild={canDeleteBranches} className="w-full">
              <DropdownMenuItem
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
              >
                <Trash2 size={14} /> Delete branch
              </DropdownMenuItem>
            </TooltipTrigger>
            {!canDeleteBranches && (
              <TooltipContent side="left">You need permissions to delete branches</TooltipContent>
            )}
          </Tooltip>

          {/* Create PR if applicable */}
          {branch.git_branch && branch.pr_number === undefined && (
            <DropdownMenuItem asChild className="gap-x-2">
              <a
                target="_blank"
                rel="noreferrer"
                href={generateCreatePullRequestURL(branch.git_branch)}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={14} /> Create Pull Request
              </a>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modals */}
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
        confirmLabel={branch.persistent ? 'Switch to ephemeral' : 'Switch to persistent'}
        title="Confirm branch mode switch"
        loading={isUpdatingBranch}
        onCancel={() => setShowBranchModeSwitch(false)}
        onConfirm={onTogglePersistent}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to switch the branch "{branch.name}" to{' '}
          {branch.persistent ? 'ephemeral' : 'persistent'} mode?
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
