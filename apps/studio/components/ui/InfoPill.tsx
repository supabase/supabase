import { ExternalLink } from 'lucide-react'
import React, { ReactNode } from 'react'

import { Badge } from 'ui/src/components/shadcn/ui/badge'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from 'ui/src/components/shadcn/ui/hover-card'

interface Link {
  url: string
  label: string
}

interface InfoPillProps {
  label: string | ReactNode
  icon: ReactNode
  title: string
  description: string | ReactNode
  links?: Link[]
}

export const InfoPill = ({ label, icon, title, description, links }: InfoPillProps) => {
  return (
    <HoverCard closeDelay={50} openDelay={300}>
      <HoverCardTrigger className="min-w-0">
        <Badge className="gap-2 py-2 h-6 min-w-0 overflow-hidden">
          <span className="flex-1 flex items-center gap-2">
            {icon} {label}
          </span>
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 flex items-start gap-3" side="right" align="center">
        <div className="rounded-full bg-surface-300 p-2 flex-shrink-0">
          {React.cloneElement(icon as React.ReactElement, {
            className: 'w-5 h-5',
            strokeWidth: 1.5,
          })}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold truncate">{title}</h4>
          <p className="text-xs text-foreground-light">{description}</p>
          {links && links.length > 0 && (
            <div className="space-y-1 mt-2">
              {links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand hover:text-brand-600 flex items-center"
                >
                  <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{link.label}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
