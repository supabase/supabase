import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout'
import AlertError from 'components/ui/AlertError'
import { useAdminProjectsQuery } from 'data/invite-codes/admin-projects-query'
import { useInviteCodesQuery } from 'data/invite-codes/invite-codes-query'
import { useState } from 'react'
import { Button } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import type { NextPageWithLayout } from 'types'
import { CreateInviteCodeDialog } from 'components/invite-codes/CreateInviteCodeDialog'
import { InviteCodeList } from 'components/invite-codes/InviteCodeList'

const InviteCodesPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const {
    data: adminProjects,
    isLoading: isLoadingProjects,
    isError: isErrorProjects,
    error: projectsError,
  } = useAdminProjectsQuery({ projectRef })

  const activeProjectId = selectedProjectId ?? adminProjects?.[0]?.id ?? null

  const {
    data: inviteCodes,
    isLoading: isLoadingCodes,
    isError: isErrorCodes,
    error: codesError,
  } = useInviteCodesQuery({ projectRef, projectId: activeProjectId ?? undefined })

  if (isErrorProjects) {
    return (
      <div className="p-6">
        <AlertError error={projectsError} subject="Failed to load company projects" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Invite Codes</h1>
          <p className="text-sm text-foreground-light mt-0.5">
            Create and manage invite codes for user registration.
          </p>
        </div>
        {activeProjectId !== null && (
          <CreateInviteCodeDialog
            projectRef={projectRef}
            projectId={activeProjectId}
          />
        )}
      </div>

      {isLoadingProjects ? (
        <GenericSkeletonLoader />
      ) : (
        <>
          {adminProjects && adminProjects.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {adminProjects.map((project) => (
                <Button
                  key={project.id}
                  type={activeProjectId === project.id ? 'primary' : 'default'}
                  size="tiny"
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  {project.name}
                </Button>
              ))}
            </div>
          )}

          {adminProjects && adminProjects.length === 0 && (
            <p className="text-sm text-foreground-light">
              No company projects found. Create a project first.
            </p>
          )}

          {isErrorCodes ? (
            <AlertError error={codesError} subject="Failed to load invite codes" />
          ) : (
            <InviteCodeList
              inviteCodes={inviteCodes ?? []}
              isLoading={isLoadingCodes}
            />
          )}
        </>
      )}
    </div>
  )
}

InviteCodesPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default InviteCodesPage
