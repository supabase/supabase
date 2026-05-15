import { PermissionAction } from '@supabase/shared-types/out/constants'
import { LOCAL_STORAGE_KEYS } from 'common'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { DeleteOrganizationButtonListAck } from './DeleteOrganizationButton.ListAck'
import { DeleteOrganizationButtonSingleAck } from './DeleteOrganizationButton.SingleAck'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import { useOrganizationDeleteMutation } from '@/data/organizations/organization-delete-mutation'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

const MAX_PROJECT_ACKNOWLEDGEMENTS = 10

export const DeleteOrganizationButton = () => {
  const router = useRouter()

  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { slug: orgSlug, name: orgName } = selectedOrganization ?? {}

  const [checkedProjects, setCheckedProjects] = useState<Record<string, boolean>>({})
  const [acknowledgedAll, setAcknowledgedAll] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setCheckedProjects({})
    setAcknowledgedAll(false)
  }, [orgSlug])

  const {
    data: projectsData,
    isLoading,
    isFetching,
    isError,
  } = useOrgProjectsInfiniteQuery(
    {
      slug: orgSlug,
      limit: MAX_PROJECT_ACKNOWLEDGEMENTS + 1,
    },
    {
      enabled: isOpen,
      refetchOnMount: 'always',
    }
  )

  // When an organization slug is present but the projects query has not yet
  // produced any data (and hasn't errored), treat this as a "pending" state
  // rather than as "no projects". This avoids interpreting lack of data as
  // an empty list, which could allow deletion to proceed without any project
  // acknowledgement.
  const isProjectsDataPending = orgSlug !== undefined && projectsData === undefined && !isError

  const projects =
    !isProjectsDataPending && projectsData !== undefined
      ? projectsData.pages.flatMap((page) => page.projects ?? [])
      : undefined

  const shouldRenderChecklist =
    projects !== undefined && projects.length > 0 && projects.length <= MAX_PROJECT_ACKNOWLEDGEMENTS

  const exceedsLimit = projects !== undefined && projects.length > MAX_PROJECT_ACKNOWLEDGEMENTS

  const toggleProject = (ref: string, checked?: boolean | 'indeterminate') => {
    setCheckedProjects((prev) => ({
      ...prev,
      [ref]: checked === undefined ? !prev[ref] : checked === true,
    }))
  }

  const isDeletionConfirmed = () => {
    // While project data is pending or unavailable, treat deletion as not confirmed
    if (!projects) return false

    if (projects.length === 0) return true

    if (shouldRenderChecklist) {
      return projects.every((p) => checkedProjects[p.ref])
    }

    if (exceedsLimit) {
      return acknowledgedAll
    }

    return false
  }

  const allChecked = isDeletionConfirmed()

  const [_, setLastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const { can: canDeleteOrganization } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'organizations'
  )

  const { mutate: deleteOrganization, isPending: isDeleting } = useOrganizationDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted ${orgName}`)
      setLastVisitedOrganization('')
      router.push('/organizations')
    },
  })

  const onConfirmDelete = () => {
    if (!canDeleteOrganization) {
      toast.error('You do not have permission to delete this organization')
      return
    }

    if (!orgSlug) {
      console.error('Org slug is required')
      return
    }

    if (isLoading || isFetching || isProjectsDataPending) {
      toast.error('Projects are still loading, please wait')
      return
    }

    if (isError) {
      toast.error('Failed to load projects')
      return
    }

    if (!allChecked) {
      toast.error('Please acknowledge all projects before deleting the organization')
      return
    }

    deleteOrganization({ slug: orgSlug })
  }

  return (
    <>
      <div className="mt-2">
        <ButtonTooltip
          type="danger"
          disabled={!canDeleteOrganization || !orgSlug}
          loading={!orgSlug}
          onClick={() => {
            setCheckedProjects({})
            setAcknowledgedAll(false)
            setIsOpen(true)
          }}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canDeleteOrganization
                ? 'You need additional permissions to delete this organization'
                : undefined,
            },
          }}
        >
          Delete organization
        </ButtonTooltip>
      </div>

      <TextConfirmModal
        visible={isOpen}
        size="small"
        variant="destructive"
        title="Delete organization"
        loading={isDeleting}
        confirmString={orgSlug ?? ''}
        confirmPlaceholder="Enter the string above"
        confirmLabel="I understand, delete this organization"
        onConfirm={onConfirmDelete}
        onCancel={() => setIsOpen(false)}
      >
        {/* ≤ MAX → checklist */}
        {shouldRenderChecklist && (
          <DeleteOrganizationButtonListAck
            projects={projects}
            checkedProjects={checkedProjects}
            toggleProject={toggleProject}
          />
        )}

        {/* > MAX → single confirmation */}
        {exceedsLimit && (
          <DeleteOrganizationButtonSingleAck
            acknowledgedAll={acknowledgedAll}
            setAcknowledgedAll={setAcknowledgedAll}
            max={MAX_PROJECT_ACKNOWLEDGEMENTS}
          />
        )}

        {/* Final warning */}
        <p
          className={`text-sm text-foreground-lighter ${(projects?.length ?? 0) > 0 ? 'mt-4' : ''}`}
        >
          This action <span className="text-foreground">cannot</span> be undone. This will
          permanently delete the <span className="text-foreground">{orgName}</span> organization and
          remove all of its projects.
        </p>
      </TextConfirmModal>
    </>
  )
}
