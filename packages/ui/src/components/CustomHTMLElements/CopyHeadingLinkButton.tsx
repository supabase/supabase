'use client'

import { CheckIcon, LinkIcon } from 'lucide-react'
import { useState } from 'react'

import { copyToClipboard } from '../../lib/utils/clipboard'
import { cn } from '../../lib/utils/cn'
import { Button } from '../Button'
import { CrossfadeIcon } from '../CrossfadeIcon/CrossfadeIcon'
import { Tooltip, TooltipContent, TooltipTrigger } from '../shadcn/ui/tooltip'

export interface CopyHeadingLinkButtonProps {
  id: string
  className?: string
}

export const CopyHeadingLinkButton = ({ id, className }: CopyHeadingLinkButtonProps) => {
  const [isCopied, setIsCopied] = useState(false)

  const handleClick = () => {
    // the url keeps its query string, so a shared link opens the same filtered view
    const url = `${window.location.href.split('#')[0]}#${id}`
    copyToClipboard(url, () => {
      setIsCopied(true)
      window.setTimeout(() => setIsCopied(false), 2000)
    })
  }

  return (
    <>
      <span role="status" className="sr-only">
        {isCopied ? 'Link copied' : ''}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="text"
            icon={
              <CrossfadeIcon active={isCopied} activeIcon={CheckIcon} inactiveIcon={LinkIcon} />
            }
            aria-label="Copy link to section"
            // the tooltip repeats the label, so screen readers read it twice
            aria-describedby={undefined}
            onClick={handleClick}
            className={cn(
              'group/btn size-7 opacity-0 transition-opacity',
              '[:hover>&]:opacity-100 focus-visible:opacity-100',
              className
            )}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">Copy link to section</TooltipContent>
      </Tooltip>
    </>
  )
}
