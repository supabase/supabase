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
          'bg-panel-header-light dark:bg-panel-header-dark  hover:bg-bg-alt-light dark:hover:bg-bg-alt-dark border',
          'border-border-secondary-light dark:border-border-secondary-dark  hover:border-border-secondary-hover-light',
          'dark:hover:border-border-secondary-hover-dark rounded-md p-4 flex flex-row h-32 hover:border-gray-300',
          'transition ease-in-out duration-150',
        ].join(' ')}
      >
        <div className="flex flex-col mr-4">
          <img
            src={`/img/libraries/${framework.toLowerCase()}-icon.svg`}
            alt={`${framework} logo`}
            width="26"
          />
        </div>
        <div className="space-y-4 w-4/5">
          <div>
            <Typography.Title level={5}>{title}</Typography.Title>
            <Typography.Text type="secondary">{description}</Typography.Text>
          </div>
        </div>
        <div>
          <IconChevronRight />
        </div>
      </div>
    </a>
  )
}

export default ExampleProject
