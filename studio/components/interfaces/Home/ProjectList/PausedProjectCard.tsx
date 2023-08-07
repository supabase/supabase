import { noop } from 'lodash'
import { Badge, Button } from 'ui'

import { Project } from 'types'

interface PausedProjectCardProps {
  project: Project
  onSelectRestore: () => void
  onSelectDelete: () => void
}

const PausedProjectCard = ({
  project,
  onSelectRestore = noop,
  onSelectDelete = noop,
}: PausedProjectCardProps) => {
  return (
    <li className="col-span-1 flex rounded-md shadow-sm">
      <a className="col-span-3 w-full md:col-span-1 ">
        <div
          className={[
            'bg-panel-header-light dark:bg-panel-header-dark',
            'hover:bg-scale-200 dark:hover:bg-scale-200',
            'border border-scale-700',
            'hover:border-scale-900',
            'h-32 rounded p-4',
            'flex flex-col justify-between transition duration-150 ease-in-out',
          ].join(' ')}
        >
          <div className="flex items-center justify-between space-x-2">
            <h5 className="m-0 truncate">{project.name}</h5>
            <Badge color="yellow" dot>
              Paused
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="tiny" onClick={() => onSelectRestore()}>
              Restore
            </Button>
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
