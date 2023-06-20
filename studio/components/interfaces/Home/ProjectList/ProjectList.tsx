import { PermissionAction } from '@supabase/shared-types/out/constants'
import { groupBy } from 'lodash'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { Badge, Button, IconPlus } from 'ui'

import { useOverdueInvoicesQuery } from 'data/invoices/invoices-overdue-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { checkPermissions, useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { makeRandomString } from 'lib/helpers'
import ProjectCard from './ProjectCard'
import ShimmeringCard from './ShimmeringCard'

export interface ProjectListProps {
  rewriteHref?: (projectRef: string) => string
}

const ProjectList = ({ rewriteHref }: ProjectListProps) => {
  const { ui } = useStore()
  const { data: organizations } = useOrganizationsQuery()
  const { data: allProjects, isLoading: isLoadingProjects } = useProjectsQuery()

  const projectsByOrg = groupBy(allProjects, 'organization_id')

  const { data: allOverdueInvoices } = useOverdueInvoicesQuery({ enabled: IS_PLATFORM })

  const isLoadingPermissions = IS_PLATFORM ? (ui?.permissions ?? []).length === 0 : false

  return (
    <>
      {organizations?.map((org) => {
        const { id, name, slug, subscription_id } = org
        const projects = projectsByOrg[id]

        const isEmpty = !projects || projects.length === 0
        const canReadProjects = checkPermissions(PermissionAction.READ, 'projects', undefined, id)

        const overdueInvoices = (allOverdueInvoices || []).filter((it) => it.organization_id === id)

        return (
          <div className="space-y-3" key={makeRandomString(5)}>
            <div className="flex space-x-4 items-center">
              <h4 className="text-lg flex items-center">
                {name}
                {subscription_id ? <Badge className="ml-3">V2</Badge> : <></>}
              </h4>

              {!!overdueInvoices.length && (
                <div>
                  <Link href={`/org/${slug}/invoices`}>
                    <a>
                      <Button type="danger">Outstanding Invoices</Button>
                    </a>
                  </Link>
                </div>
              )}
            </div>

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
                        Contact your organization owner or administrator for assistance.
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
                  projects?.map((project) => (
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
