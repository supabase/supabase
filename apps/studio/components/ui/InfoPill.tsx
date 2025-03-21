import React from 'react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from 'ui/src/components/shadcn/ui/hover-card'
import { Badge } from 'ui/src/components/shadcn/ui/badge'
import { ExternalLink } from 'lucide-react'

interface Link {
  url: string
  label: string
}

interface InfoPillProps {
  label: string
  icon: React.ReactNode
  title: string
  description: string
  links?: Link[]
}

export const InfoPill: React.FC<InfoPillProps> = ({ label, icon, title, description, links }) => {
  return (
    <HoverCard closeDelay={50} openDelay={300}>
      <HoverCardTrigger>
        <Badge className="gap-2 py-0 hover:border-foreground">
          {icon} {label}
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
          <h4 className="text-sm font-semibold truncate">{title}</h4>
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
