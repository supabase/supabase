import { User } from 'lucide-react'

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from 'ui/src/components/shadcn/ui/hover-card'

interface AuthUserHoverCardProps {
  authUser: string
}

export const AuthUserHoverCard = ({ authUser }: AuthUserHoverCardProps) => {
  if (!authUser) return null

  return (
    <HoverCard closeDelay={0}>
      <HoverCardTrigger className="flex items-center justify-center bg-surface-100 border rounded-full">
        <User size={14} className="text-foreground-lighter" />
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User size={20} className="text-foreground" />
            <h4 className="font-medium">User Details</h4>
          </div>
          <div className="space-y-1">
            <div className="text-sm">
              <span className="font-medium">ID/Email:</span> {authUser}
            </div>
            {/* Additional user details can be added here if available */}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
