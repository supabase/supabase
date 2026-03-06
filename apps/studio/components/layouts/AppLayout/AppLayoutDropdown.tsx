import { AlertCircle, ChevronsUpDown } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Button, cn, Popover_Shadcn_, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_ } from 'ui'

interface AppLayoutDropdownErrorProps {
  message: string
}

export function AppLayoutDropdownError({ message }: AppLayoutDropdownErrorProps) {
  return (
    <div className="flex items-center space-x-2 text-amber-900">
      <AlertCircle size={16} strokeWidth={1.5} />
      <p className="text-sm">{message}</p>
    </div>
  )
}

interface AppLayoutDropdownTriggerButtonProps {
  className?: string
}

export function AppLayoutDropdownTriggerButton({
  className,
}: AppLayoutDropdownTriggerButtonProps = {}) {
  return (
    <Button
      type="text"
      block
      size="tiny"
      className={cn('px-1.5 py-4 [&_svg]:w-5 [&_svg]:h-5 ml-1', className)}
      iconRight={<ChevronsUpDown strokeWidth={1.5} />}
    />
  )
}

export interface AppLayoutDropdownWithPopoverProps {
  linkHref: string
  linkContent: ReactNode
  linkClassName?: string
  commandContent: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerButtonClassName?: string
}

export function AppLayoutDropdownWithPopover({
  linkHref,
  linkContent,
  linkClassName = 'flex items-center gap-2 flex-shrink-0 text-sm',
  commandContent,
  open,
  onOpenChange,
  triggerButtonClassName,
}: AppLayoutDropdownWithPopoverProps) {
  return (
    <>
      <Link href={linkHref} className={linkClassName}>
        {linkContent}
      </Link>
      <Popover_Shadcn_ open={open} onOpenChange={onOpenChange} modal={false}>
        <PopoverTrigger_Shadcn_ asChild>
          <AppLayoutDropdownTriggerButton className={triggerButtonClassName} />
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
          {commandContent}
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </>
  )
}
