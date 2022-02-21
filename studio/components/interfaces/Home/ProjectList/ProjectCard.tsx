import { FC } from 'react'
import Link from 'next/link'
import { Typography } from '@supabase/ui'
import { Project } from 'types'

interface Props {
  project: Project
  rewriteHref?: string
}

const ProjectCard: FC<Props> = ({ project, rewriteHref }) => {
  const { name, ref: projectRef, status } = project
  const desc = `${project.cloud_provider} | ${project.region}`
  return (
    <li className="col-span-1 flex shadow-sm rounded-md">
      <Link href={rewriteHref ?? `/project/${projectRef}`}>
        <a className="w-full col-span-3 md:col-span-1">
          <div
            className="bg-panel-header-light dark:bg-panel-header-dark hover:bg-bg-alt-light 
          dark:hover:bg-bg-alt-dark border border-border-secondary-light 
          dark:border-border-secondary-dark hover:border-border-secondary-hover-light 
          dark:hover:border-border-secondary-hover-dark p-4 h-32 rounded transition 
          ease-in-out duration-150 flex flex-col justify-between"
          >
            <Typography.Title level={4}>{name}</Typography.Title>
            <div className="lowercase">
              <Typography.Text>{desc}</Typography.Text>
            </div>
          </div>
        </a>
      </Link>
    </li>
  )
}

export default ProjectCard
