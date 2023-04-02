import Link from 'next/link'
import { FC, ReactNode, useState } from 'react'
import { Button, IconExternalLink, IconMaximize2, IconMinimize2 } from 'ui'

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
      block w-full rounded border border-scale-600 bg-scale-100 py-3 dark:border-scale-500 dark:bg-scale-400 ${className}`}
    >
      <div className="flex flex-col px-4">
        <div className="flex items-center justify-between">
          <div className="flex w-full space-x-3 lg:items-start">
            {icon && <span className="text-scale-900">{icon}</span>}
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
        {(description || url || button) && (
          <div
            className={`flex flex-col space-y-3 overflow-hidden transition-all ${
              isExpanded ? 'mt-3' : ''
            }`}
            style={{ maxHeight: isExpanded ? 500 : 0 }}
          >
            <div className="text-scale-1100 text-sm">{description}</div>

            {url && (
              <Link href={url}>
                <a target="_blank" className="pt-2">
                  <Button type="default" icon={<IconExternalLink />}>
                    {urlLabel}
                  </Button>
                </a>
              </Link>
            )}

            {button && <div>{button}</div>}
          </div>
        )}
      </div>
    </div>
  )
}

export default InformationBox
