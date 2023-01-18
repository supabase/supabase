import Link from 'next/link'
import { FC } from 'react'
import { Button, IconPlus } from 'ui'
import { observer } from 'mobx-react-lite'

import { IS_PLATFORM } from 'lib/constants'
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
  const { app, ui } = useStore()
  const { organizations, projects } = app
  const { isLoading: isLoadingProjects } = projects

  const isLoadingPermissions = IS_PLATFORM ? (ui?.permissions ?? []).length === 0 : false

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
            {isLoadingPermissions || isLoadingProjects ? (
              <ul className="mx-auto grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                <ShimmeringCard />
                <ShimmeringCard />
              </ul>
            ) : (
              <ul className="mx-auto grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {!canReadProjects ? (
                  <div className="col-span-4 space-y-4 rounded-lg border-2 border-dashed border-gray-300 py-8 px-6 text-center">
                    <div className="space-y-1">
                      <p>You need additional permissions to view projects from this organization</p>
                      <p className="text-sm text-scale-1100">
                        Contact your organization owner or adminstrator for assistance.
                      </p>
                    </div>
                  </div>
                ) : isEmpty ? (
                  <div className="col-span-4 space-y-4 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                    <div className="space-y-1">
                      <p>No projects</p>
                      <p className="text-sm text-scale-1100">
                        Get started by creating a new project.
                      </p>
                    </div>
                    <div>
                      <Link href={`/new/${slug}`}>
                        <a>
                          <Button icon={<IconPlus />}>New Project</Button>
                        </a>
                      </Link>
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
