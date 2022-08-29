import { FC } from 'react'
import { Button, IconPlus } from '@supabase/ui'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'

import { checkPermissions, useStore } from 'hooks'
import { Organization, Project } from 'types'
import { makeRandomString } from 'lib/helpers'
import ProjectCard from './ProjectCard'
import ShimmeringCard from './ShimmeringCard'
import { PermissionAction } from '@supabase/shared-types/out/constants'

interface Props {
  rewriteHref?: (projectRef: string) => string
}

const ProjectList: FC<Props> = ({ rewriteHref }) => {
  const router = useRouter()
  const { app } = useStore()
  const { organizations, projects } = app
  const { isLoading: isLoadingProjects } = projects

  return (
    <>
      {organizations.list().map((org: Organization) => {
        const { id, name, slug } = org
        const sortedProjects = projects.list(
          ({ organization_id }: Project) => organization_id == id
        )
        const isEmpty = sortedProjects?.length == 0
        const canReadProjects = checkPermissions(PermissionAction.READ, 'projects', undefined, id)

        return (
          <div className="space-y-3" key={makeRandomString(5)}>
            <h4 className="text-lg">{name}</h4>
            {isLoadingProjects ? (
              <ul className="mx-auto grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ">
                <ShimmeringCard />
                <ShimmeringCard />
              </ul>
            ) : (
              <ul className="mx-auto grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ">
                {!canReadProjects ? (
                  <div className="col-span-4 max-w-4xl space-y-4 rounded-lg border-2 border-dashed border-gray-300 py-8 px-6 text-center">
                    <div className="space-y-1">
                      <p>You need additional permissions to view projects from this organization</p>
                      <p className="text-scale-1100 text-sm">
                        Contact your organization owner or adminstrator for assistance.
                      </p>
                    </div>
                  </div>
                ) : isEmpty ? (
                  <div className="col-span-4 max-w-4xl space-y-4 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                    <div className="space-y-1">
                      <p>No projects</p>
                      <p className="text-scale-1100 text-sm">
                        Get started by creating a new project.
                      </p>
                    </div>
                    <div>
                      <Button onClick={() => router.push(`/new/${slug}`)} icon={<IconPlus />}>
                        New Project
                      </Button>
                    </div>
                  </div>
                ) : (
                  sortedProjects?.map((project: Project) => (
                    <ProjectCard
                      key={makeRandomString(5)}
                      project={project}
                      rewriteHref={rewriteHref ? rewriteHref(project.ref) : undefined}
                    />
                  ))
                )}
              </ul>
            )}
          </div>
        )
      })}
    </>
  )
}

export default observer(ProjectList)
