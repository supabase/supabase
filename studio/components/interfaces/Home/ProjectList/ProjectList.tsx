import { FC } from 'react'
import { Button, IconLoader, IconPlus, Loading } from '@supabase/ui'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'

import { useStore } from 'hooks'
import { Organization, Project } from 'types'
import { makeRandomString } from 'lib/helpers'
import { PROJECT_STATUS } from 'lib/constants'
import ProjectCard from './ProjectCard'

interface Props {
  onSelectRestore: (project: Project) => void
  onSelectDelete: (project: Project) => void
  rewriteHref?: (projectRef: string) => string
}

const ProjectList: FC<Props> = ({
  onSelectRestore = () => {},
  onSelectDelete = () => {},
  rewriteHref,
}) => {
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
        return (
          <div className="space-y-3" key={makeRandomString(5)}>
            <h4 className="text-lg">{name}</h4>
            <Loading active={isLoadingProjects}>
              <ul className="grid gap-4 mx-auto grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ">
                {!isLoadingProjects && isEmpty && (
                  <div className="max-w-4xl text-center col-span-4 space-y-4 border-2 border-gray-300 border-dashed rounded-lg p-6">
                    <div className="space-y-1">
                      <p>No projects</p>
                      <p className="text-sm text-scale-1100">
                        Get started by creating a new project.
                      </p>
                    </div>
                    <div>
                      <Button onClick={() => router.push(`/new/${slug}`)} icon={<IconPlus />}>
                        New Project
                      </Button>
                    </div>
                  </div>
                )}
                {sortedProjects?.map((project: Project) => (
                  <ProjectCard
                    key={makeRandomString(5)}
                    project={project}
                    paused={project.status === PROJECT_STATUS.INACTIVE}
                    rewriteHref={rewriteHref ? rewriteHref(project.ref) : undefined}
                    onSelectDelete={() => onSelectDelete(project)}
                    onSelectRestore={() => onSelectRestore(project)}
                  />
                ))}
              </ul>
            </Loading>
          </div>
        )
      })}
    </>
  )
}

export default observer(ProjectList)
