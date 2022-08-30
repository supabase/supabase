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
      bg-scale-100 dark:bg-scale-400 border-scale-600 dark:border-scale-500 block w-full rounded border py-3 ${className}`}
    >
      <div className="flex flex-col px-4">
        <div className="flex items-center justify-between">
          <div className="flex w-full space-x-3 lg:items-center">
            {icon && <span className="text-scale-900">{icon}</span>}
            <div className="flex-grow">
              <h5 className="text-scale-1200 text-sm">{title}</h5>
            </div>
          </div>
          {description && !hideCollapse ? (
            <div
              className="text-scale-900 cursor-pointer"
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
          className={`flex flex-col space-y-3 overflow-hidden transition-all ${
            isExpanded ? 'mt-3' : ''
          }`}
          style={{ maxHeight: isExpanded ? 500 : 0 }}
        >
          <div className="text-scale-1100 text-sm">{description}</div>

          {url && (
            <a
              href={url}
              target="_blank"
              className="text-scale-1100 hover:text-scale-1200 text-sm underline transition-colors"
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
