'use client'

import { cva } from 'class-variance-authority'
import { FileIcon, FolderIcon, FolderOpen } from 'lucide-react'
import { useState, type HTMLAttributes, type ReactNode } from 'react'
import { cn, Collapsible_Shadcn_, CollapsibleContent_Shadcn_, CollapsibleTrigger_Shadcn_ } from 'ui'

const itemVariants = cva(
  'flex flex-row items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-fd-accent hover:text-fd-accent-foreground [&_svg]:size-4'
)

export function Files({ className, ...props }: HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div className={cn('not-prose rounded-md border bg-fd-card p-2', className)} {...props}>
      {props.children}
    </div>
  )
}

export interface FileProps extends HTMLAttributes<HTMLDivElement> {
  name: string
  icon?: ReactNode
}

export interface FolderProps extends HTMLAttributes<HTMLDivElement> {
  name: string

  disabled?: boolean

  /**
   * Open folder by default
   *
   * @defaultValue false
   */
  defaultOpen?: boolean
}

export function File({
  name,
  icon = <FileIcon />,
  className,
  ...rest
}: FileProps): React.ReactElement {
  return (
    <div className={cn(itemVariants({ className }))} {...rest}>
      {icon}
      {name}
    </div>
  )
}

export function Folder({ name, defaultOpen = false, ...props }: FolderProps): React.ReactElement {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible_Shadcn_ open={open} onOpenChange={setOpen} {...props}>
      <CollapsibleTrigger_Shadcn_ className={cn(itemVariants({ className: 'w-full' }))}>
        {open ? <FolderOpen /> : <FolderIcon />}
        {name}
      </CollapsibleTrigger_Shadcn_>
      <CollapsibleContent_Shadcn_>
        <div className="ms-2 flex flex-col border-l ps-2">{props.children}</div>
      </CollapsibleContent_Shadcn_>
    </Collapsible_Shadcn_>
  )
}
