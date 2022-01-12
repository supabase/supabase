import { FC } from 'react'
import { Typography, Badge, Button } from '@supabase/ui'
import * as Tooltip from '@radix-ui/react-tooltip'

import { Project } from 'types'

interface Props {
  project: Project
  onSelectRestore: () => void
  onSelectDelete: () => void
}

const PausedProjectCard: FC<Props> = ({
  project,
  onSelectRestore = () => {},
  onSelectDelete = () => {},
}) => {
  return (
    <li className="col-span-1 flex shadow-sm rounded-md">
      <a className="w-full col-span-3 md:col-span-1 ">
        <div
          className={[
            'bg-panel-header-light dark:bg-panel-header-dark',
            'hover:bg-bg-alt-light dark:hover:bg-bg-alt-dark',
            'border border-border-secondary-light dark:border-border-secondary-dark',
            'hover:border-border-secondary-hover-light dark:hover:border-border-secondary-hover-dark',
            'p-4 h-32 rounded',
            'transition ease-in-out duration-150 flex flex-col justify-between',
          ].join(' ')}
        >
          <div className="flex items-center justify-between space-x-2">
            <Typography.Title level={4} className="m-0 truncate">
              {project.name}
            </Typography.Title>
            <Badge color="yellow" dot>
              Paused
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger>
                <Button size="tiny" onClick={() => {}}>
                  Restore
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content side="top">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'shadow px-2 py-1 rounded border',
                    'bg-white flex flex-col space-y-1 items-center justify-center',
                    'dark:bg-gray-800 dark:border-gray-700',
                  ].join(' ')}
                >
                  <Typography.Text small>
                    Sorry! New projects cannot be created at the moment.{' '}
                  </Typography.Text>
                  <Typography.Text small>Check status.supabase.com for updates!</Typography.Text>
                </div>
              </Tooltip.Content>
            </Tooltip.Root>

            {/* TODO: Revert back after incident is resolved */}
            {/* <Button size="tiny" onClick={() => onSelectRestore()}>
              Restore
            </Button> */}
            <Button size="tiny" type="outline" onClick={() => onSelectDelete()}>
              Delete
            </Button>
          </div>
        </div>
      </a>
    </li>
  )
}

export default PausedProjectCard
