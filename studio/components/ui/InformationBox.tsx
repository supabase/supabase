import Link from 'next/link'
import { FC, ReactNode, useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconExternalLink,
  IconMaximize2,
  IconMinimize2,
} from 'ui'

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
    <Alert_Shadcn_ className={block ? 'block w-full' : ''}>
      {icon}
      <AlertTitle_Shadcn_ className="flex gap-3 justify-between mt-1">
        {title}

        {description && !hideCollapse ? (
          <div className="cursor-pointer text-scale-900" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? (
              <IconMinimize2 size={14} strokeWidth={1.5} />
            ) : (
              <IconMaximize2 size={14} strokeWidth={1.5} />
            )}
          </div>
        ) : null}
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        {(description || url || button) && (
          <div
            className={`flex flex-col gap-3 overflow-hidden transition-all ${
              isExpanded ? 'mt-3' : ''
            }`}
            style={{ maxHeight: isExpanded ? 500 : 0 }}
          >
            {description}
            {url && (
              <Link href={url}>
                <a target="_blank" rel="noreferrer" className="pt-2">
                  <Button type="default" icon={<IconExternalLink />}>
                    {urlLabel}
                  </Button>
                </a>
              </Link>
            )}
            {button && <div>{button}</div>}
          </div>
        )}
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

export default InformationBox
