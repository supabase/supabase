import Link from 'next/link'
import { useState } from 'react'
import {
  Badge,
  Button,
  IconGitBranch,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

interface BranchingWaitlistPopoverProps {
  isNewNav?: boolean
}

const BranchingWaitlistPopover = ({ isNewNav = false }: BranchingWaitlistPopoverProps) => {
  const [open, setOpen] = useState(false)

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type={isNewNav ? 'default' : 'text'} icon={<IconGitBranch strokeWidth={1.5} />}>
          Enable branching
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        align="start"
        side="bottom"
        className="space-y-4 w-80"
        style={{ marginLeft: '-18px' }}
      >
        <Badge color="scale">Alpha Testing</Badge>
        <div className="flex items-center space-x-2">
          <IconGitBranch strokeWidth={2} />
          <p>Database Branching</p>
        </div>
        <p className="text-xs text-foreground-light">
          Register for early access and you'll be contacted by email when your organization is
          enrolled in database branching.
        </p>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link
              href="https://forms.supabase.com/branching-request"
              rel="noreferrer"
              target="_blank"
            >
              Join waitlist
            </Link>
          </Button>
          {/* <Link passHref href={'/'}>
            <a rel="noreferrer" target="_blank">
              <Button type="default">View the docs</Button>
            </a>
          </Link> */}
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default BranchingWaitlistPopover
