import { FC } from 'react'
import { Typography, IconChevronRight } from '@supabase/ui'

interface Props {
  framework: string
  title: string
  description: string
  url: string
}

const ExampleProject: FC<Props> = ({ framework, title, description, url }) => {
  return (
    <a href={url}>
      <div
        className={[
          'group relative',
          'bg-panel-header-light dark:bg-panel-header-dark  hover:bg-panel-border-light dark:hover:bg-panel-border-dark border',
          'border-panel-border-light dark:border-panel-border-dark  hover:border-panel-border-hover-light',
          'dark:hover:border-panel-border-hover-dark rounded-md p-4 flex flex-row h-32 hover:border-gray-300',
          'transition ease-in-out duration-150',
        ].join(' ')}
      >
        <div className="flex flex-col mr-4">
          <img
            className="
              transition-all
              group-hover:scale-110
            "
            src={`/img/libraries/${framework.toLowerCase()}-icon.svg`}
            alt={`${framework} logo`}
            width="26"
          />
        </div>
        <div className="space-y-2 w-4/5">
          <h5 className="text-scale-1200">{title}</h5>
          <p className="text-scale-1000 text-sm">{description}</p>
        </div>
        <div
          className="
          absolute
          right-4
          top-3
          text-scale-900
          transition-all 
          duration-200 
          group-hover:right-3
          group-hover:text-scale-1200
        "
        >
          <IconChevronRight />
        </div>
      </div>
    </a>
  )
}

export default ExampleProject
