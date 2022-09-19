import * as RadixCollapsible from '@radix-ui/react-collapsible'
import React from 'react'
import styleHandler from '../../lib/theme/styleHandler'

export interface CollapsibleProps extends RadixCollapsible.CollapsibleProps {
  children: React.ReactNode
  // onChange?: (e: boolean) => void
}

export const Collapsible = ({
  open = undefined,
  children,
  className,
  ...props
}: CollapsibleProps) => {
  //   const [_open, setOpen] = React.useState(open)

  // function handleOpenChange(e: boolean) {
  //   console.log(e)
  //   if (onChange) onChange(e)
  // }
  return (
    <RadixCollapsible.Root
      defaultOpen={props.defaultOpen}
      open={open}
      onOpenChange={props.onOpenChange}
      disabled={props.disabled}
      className={className}
    >
      {children}
    </RadixCollapsible.Root>
  )
}

export function Trigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  return <RadixCollapsible.Trigger asChild={asChild}>{children}</RadixCollapsible.Trigger>
}

export function Content({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const __styles = styleHandler('collapsible')
  return (
    <RadixCollapsible.Content className={[__styles.content, className].join(' ')}>
      {children}
    </RadixCollapsible.Content>
  )
}

Collapsible.Trigger = Trigger
Collapsible.Content = Content
export default Collapsible
