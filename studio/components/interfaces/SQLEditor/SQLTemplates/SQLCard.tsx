import { FC, useState } from 'react'
import { Typography, IconChevronRight, IconLoader } from '@supabase/ui'
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
        <Typography.Title level={5} className="m-0">
          {title}
        </Typography.Title>
        {loading ? (
          <div className="animate-spin">
            <IconLoader size={16} />
          </div>
        ) : (
          <Typography.Text type="secondary">
            <IconChevronRight />
          </Typography.Text>
        )}
      </div>
      <p className="px-6 py-4 capitalize-first">
        <Typography.Text type="secondary">{description}</Typography.Text>
      </p>
    </div>
  )
}

export default SQLCard
