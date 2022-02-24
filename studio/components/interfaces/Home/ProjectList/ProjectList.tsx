import { FC } from 'react'
import { Button, IconPlus, Loading, Typography } from '@supabase/ui'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'

import { useStore } from 'hooks'
import { Organization, Project } from 'types'
import { makeRandomString } from 'lib/helpers'
import { PROJECT_STATUS } from 'lib/constants'
import ProjectCard from './ProjectCard'
import PausedProjectCard from './PausedProjectCard'

interface Props {
  onSelectRestore: (project: Project) => void
  onSelectDelete: (project: Project) => void
  showInactiveProjects?: boolean
  rewriteHref?: (projectRef: string) => string
}

const ProjectList: FC<Props> = ({
  onSelectRestore = () => {},
  onSelectDelete = () => {},
  showInactiveProjects = true,
  rewriteHref,
}) => {
  const router = useRouter()
  const { app } = useStore()
  const { organizations, projects } = app
  const { isLoading } = projects

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
            <Loading active={isLoading}>
              <Typography.Title level={4}>{name}</Typography.Title>
            </Loading>
            <ul className="grid grid-cols-1 gap-4 mx-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {!isLoading && isEmpty && (
                <div className="max-w-4xl text-center col-span-4 space-y-4 border-2 border-gray-300 border-dashed rounded-lg p-6">
                  <Typography.Title level={5}>No projects.</Typography.Title>
                  <Typography.Text>Get started by creating a new project.</Typography.Text>
                  <div>
                    <Button onClick={() => router.push(`/new/${slug}`)} icon={<IconPlus />}>
                      New Project
                    </Button>
                  </div>
                </div>
              )}
              {sortedProjects?.map((project: Project) =>
                project.status === PROJECT_STATUS.INACTIVE ? (
                  showInactiveProjects && (
                    <PausedProjectCard
                      key={makeRandomString(5)}
                      project={project}
                      onSelectDelete={() => onSelectDelete(project)}
                      onSelectRestore={() => onSelectRestore(project)}
                    />
                  )
                ) : (
                  <ProjectCard
                    key={makeRandomString(5)}
                    project={project}
                    rewriteHref={rewriteHref ? rewriteHref(project.ref) : undefined}
                  />
                )
              )}
            </ul>
          </div>
        )
      })}
    </>
  )
}

export default observer(ProjectList)
