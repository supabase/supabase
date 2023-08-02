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

const BranchingWaitlistPopover = () => {
  const [open, setOpen] = useState(false)

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type="default" icon={<IconGitBranch strokeWidth={1.5} />}>
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
        <p className="text-xs text-light">
          Register for early access and you'll be contacted by email when your organization is
          enrolled in database branching.
        </p>
        <div className="flex items-center space-x-2">
          <Link passHref href={'/'}>
            <a rel="noreferrer" target="_blank">
              <Button>Join waitlist</Button>
            </a>
          </Link>
          <Link passHref href={'/'}>
            <a rel="noreferrer" target="_blank">
              <Button type="default">View the docs</Button>
            </a>
          </Link>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default BranchingWaitlistPopover
