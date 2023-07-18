import clsx from 'clsx'
import Link from 'next/link'
import { Project } from 'types'

interface ProjectSettingsMenuItemProps {
  project: Project
}

const ProjectSettingsMenuItem = ({ project }: ProjectSettingsMenuItemProps) => {
  return (
    <div>
      <Link href={'/'}>
        <a
          className={clsx(
            'text-sm',
            false ? 'text-scale-1200' : 'text-scale-1100 hover:text-scale-1200 transition'
          )}
        >
          {project.name}
        </a>
      </Link>
    </div>
  )
}

export default ProjectSettingsMenuItem
