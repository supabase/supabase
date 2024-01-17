import { useSelectedOrganization } from 'hooks'
import Link from 'next/link'
import { useState } from 'react'
import {
  Badge,
  Button,
  IconExternalLink,
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
  const org = useSelectedOrganization()

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type={isNewNav ? 'default' : 'text'} icon={<IconGitBranch strokeWidth={1.5} />}>
          Enable branching
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ align="start" side="bottom" className="flex flex-col gap-4 w-80">
        <div>
          <Badge color="scale">Alpha Testing</Badge>
        </div>
        <div className="flex items-center gap-2">
          <IconGitBranch strokeWidth={2} />
          <p>Database Branching</p>
        </div>
        <p className="text-xs text-foreground-light">
          Database Branching is currently in early access and not available publicly yet.
        </p>
        <div className="flex items-center gap-2">
          <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />} asChild>
            <a
              target="_blank"
              rel="noreferrer"
              href="https://supabase.com/docs/guides/platform/branching"
            >
              View the docs
            </a>
          </Button>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default BranchingWaitlistPopover
