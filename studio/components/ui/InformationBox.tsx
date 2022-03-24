import { FC, ReactNode, useState } from 'react'
import { IconMaximize2, IconMinimize2 } from '@supabase/ui'

interface Props {
  icon?: ReactNode
  title: ReactNode | string
  description?: ReactNode | string
  url?: string
  urlLabel?: string
  defaultVisibility?: boolean
  hideCollapse?: boolean
  button?: React.ReactNode
  className?: string
  block?: boolean
}

const InformationBox: FC<Props> = ({
  icon,
  title,
  description,
  url,
  urlLabel = 'Read more',
  defaultVisibility = false,
  hideCollapse = false,
  button,
  className = '',
  block = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultVisibility)

  return (
    <div
      className={`${block ? 'block w-full' : ''}
      block w-full bg-scale-100 dark:bg-scale-400 py-3 border border-scale-600 dark:border-scale-500 rounded ${className}`}
    >
      <div className="flex flex-col px-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-3 w-full lg:items-center">
            <span className="text-scale-900">{icon}</span>
            <div className="flex-grow">
              <h5 className="text-sm text-scale-1200">{title}</h5>
            </div>
          </div>
          {description && !hideCollapse ? (
            <div
              className="cursor-pointer text-scale-900"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <IconMinimize2 size={14} strokeWidth={1.5} />
              ) : (
                <IconMaximize2 size={14} strokeWidth={1.5} />
              )}
            </div>
          ) : null}
        </div>
        <div
          className={`transition-all flex flex-col space-y-3 overflow-hidden ${
            isExpanded ? 'mt-3' : ''
          }`}
          style={{ maxHeight: isExpanded ? 500 : 0 }}
        >
          <p className="text-sm text-scale-1100">{description}</p>

          {url && (
            <a
              href={url}
              target="_blank"
              className="text-sm transition-colors underline text-scale-1100 hover:text-scale-1200"
            >
              {urlLabel}
            </a>
          )}

          {button && <div>{button}</div>}
        </div>
      </div>
    </div>
  )
}

export default InformationBox
