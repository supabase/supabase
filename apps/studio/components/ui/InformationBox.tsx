import { ExternalLink, Maximize2, Minimize2 } from 'lucide-react'
import Link from 'next/link'
import { ReactNode, useState, forwardRef } from 'react'

import { Button } from 'ui'

interface InformationBoxProps {
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

const InformationBox = forwardRef<HTMLDivElement, InformationBoxProps>(
  (
    {
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
    },
    ref
  ) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(defaultVisibility)

    return (
      <div
        ref={ref}
        role="alert"
        className={`${block ? 'block w-full' : ''}
      block w-full rounded-md border bg-surface-300/25 py-3 ${className}`}
      >
        <div className="flex flex-col px-4">
          <div className="flex items-center justify-between">
            <div className="flex w-full space-x-3 items-center">
              {icon && <span className="text-foreground-lighter">{icon}</span>}
              <div className="flex-grow">
                <h5 className="text-sm text-foreground">{title}</h5>
              </div>
            </div>
            {description && !hideCollapse ? (
              <div
                className="cursor-pointer text-foreground-lighter"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <Minimize2 size={14} strokeWidth={1.5} />
                ) : (
                  <Maximize2 size={14} strokeWidth={1.5} />
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
              <div className="text-foreground-light text-sm">{description}</div>

              {url && (
                <div>
                  <Button asChild type="default" icon={<ExternalLink />}>
                    <Link href={url} target="_blank" rel="noreferrer">
                      {urlLabel}
                    </Link>
                  </Button>
                </div>
              )}

              {button && <div>{button}</div>}
            </div>
          )}
        </div>
      </div>
    )
  }
)

InformationBox.displayName = 'InformationBox'
export default InformationBox
