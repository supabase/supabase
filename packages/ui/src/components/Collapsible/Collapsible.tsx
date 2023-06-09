import * as RadixCollapsible from '@radix-ui/react-collapsible'
import React from 'react'
import styleHandler from '../../lib/theme/styleHandler'

export interface CollapsibleProps extends RadixCollapsible.CollapsibleProps {
  children: React.ReactNode
}

export const Collapsible = ({
  open = undefined,
  children,
  className,
  ...props
}: CollapsibleProps) => {
  return (
    <RadixCollapsible.Root
      asChild={props.asChild}
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
  asChild,
  children,
  className,
}: {
  asChild?: boolean
  children: React.ReactNode
  className?: string
}) {
  const __styles = styleHandler('collapsible')
  return (
    <RadixCollapsible.Content asChild={asChild} className={[__styles.content, className].join(' ')}>
      {children}
    </RadixCollapsible.Content>
  )
}

Collapsible.Trigger = Trigger
Collapsible.Content = Content
export default Collapsible
