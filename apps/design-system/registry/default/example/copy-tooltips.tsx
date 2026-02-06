'use client'

import { Info } from 'lucide-react'
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'ui'

export default function CopyTooltips() {
  return (
    <div className="flex flex-row gap-20">
      <div className="flex flex-col gap-4">
        <span className="text-xs text-foreground-muted">Bad Example</span>
        <div className="flex flex-row gap-8 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="text"
                  className="flex items-center px-1.5"
                  icon={<Info size={20} strokeWidth={1.5} />}
                  aria-label="More info"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>This is a toggle switch</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <span className="text-xs text-foreground-muted">Good Example</span>
        <div className="flex flex-row gap-8 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="text"
                  className="flex items-center px-1.5"
                  icon={<Info size={20} strokeWidth={1.5} />}
                  aria-label="More info"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Restricts access based on user policies</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
