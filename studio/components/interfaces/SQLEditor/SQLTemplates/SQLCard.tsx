import { FC, useState } from 'react'
import { IconChevronRight, IconLoader } from 'ui'
import { SQLTemplate } from '../SQLEditor.types'

interface Props {
  template: SQLTemplate
}

const SQLCard: FC<Props> = ({ template }) => {
  const { title, description } = template
  const [loading, setLoading] = useState(false)

  return (
    <div
      className="w-full cursor-pointer rounded border 
      border-panel-border-light bg-panel-header-light transition-colors 
      hover:border-panel-border-hover-light dark:border-panel-border-dark 
      dark:bg-panel-header-dark dark:hover:border-panel-border-hover-dark"
    >
      <div className="flex items-center justify-between border-b px-6 py-3 dark:border-dark">
        <h5 className="m-0">{title}</h5>
        {loading ? (
          <div className="animate-spin">
            <IconLoader size={16} />
          </div>
        ) : (
          <p className="text-scale-1000">
            <IconChevronRight />
          </p>
        )}
      </div>
      <p className="capitalize-first px-6 py-4">
        <p className="text-scale-1000">{description}</p>
      </p>
    </div>
  )
}

export default SQLCard
