import { CalendarDays } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from 'ui'
import { Button } from 'ui'
import { HoverCard_Shadcn_, HoverCardContent_Shadcn_, HoverCardTrigger_Shadcn_ } from 'ui'

export default function HoverCardDemo() {
  return (
    <HoverCard_Shadcn_>
      <HoverCardTrigger_Shadcn_ asChild>
        <Button type="link">@nextjs</Button>
      </HoverCardTrigger_Shadcn_>
      <HoverCardContent_Shadcn_ className="w-80">
        <div className="flex justify-between space-x-4">
          <Avatar>
            <AvatarImage src="https://github.com/vercel.png" />
            <AvatarFallback>VC</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">@nextjs</h4>
            <p className="text-sm">The React Framework – created and maintained by @vercel.</p>
            <div className="flex items-center pt-2">
              <CalendarDays className="mr-2 h-4 w-4 opacity-70" />{' '}
              <span className="text-xs text-muted-foreground">Joined December 2021</span>
            </div>
          </div>
        </div>
      </HoverCardContent_Shadcn_>
    </HoverCard_Shadcn_>
  )
}
