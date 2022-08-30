import { FC, useState } from 'react'
import { IconChevronRight, IconLoader } from '@supabase/ui'
import { SQLTemplate } from '../SQLEditor.types'

interface Props {
  template: SQLTemplate
}

const SQLCard: FC<Props> = ({ template }) => {
  const { title, description } = template
  const [loading, setLoading] = useState(false)

  return (
    <div
      className="rounded bg-panel-header-light dark:bg-panel-header-dark transition-colors 
      border border-panel-border-light dark:border-panel-border-dark 
      hover:border-panel-border-hover-light dark:hover:border-panel-border-hover-dark 
      cursor-pointer w-full"
    >
      <div className="px-6 py-3 border-b dark:border-dark flex items-center justify-between">
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
      <p className="px-6 py-4 capitalize-first">
        <p className="text-scale-1000">{description}</p>
      </p>
    </div>
  )
}

export default SQLCard
