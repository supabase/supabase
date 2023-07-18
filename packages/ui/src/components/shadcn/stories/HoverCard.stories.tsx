import { Meta } from '@storybook/react'
import { Avatar, AvatarFallback, AvatarImage } from '@ui/components/shadcn/ui/avatar'
import { Button } from '@ui/components/shadcn/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@ui/components/shadcn/ui/hover-card'
import { CalendarDays } from 'lucide-react'

const meta: Meta = {
  title: 'shadcn/HoverCard',
  component: HoverCard,
}

export function Default() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">@nextjs</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
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
      </HoverCardContent>
    </HoverCard>
  )
}

export default meta
