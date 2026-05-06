'use client'

import { Triangle } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { Collapsible_Shadcn_, CollapsibleContent_Shadcn_, CollapsibleTrigger_Shadcn_ } from 'ui'

type BlogCollapsibleProps = PropsWithChildren<{
  title: string
  containerClassName?: string
}>

const BlogCollapsible = ({ title, containerClassName, ...props }: BlogCollapsibleProps) => {
  return (
    <Collapsible_Shadcn_ className={containerClassName}>
      <CollapsibleTrigger_Shadcn_
        className="
        data-[state=open]:text
        hover:text-foreground-light
        flex items-center gap-3
        [&>svg]:fill-current
        [&>svg]:rotate-90
        [&>svg]:transition-transform
        [&>svg]:data-[state='open']:rotate-180
        [&>svg]:data-[state='open']:text
        "
      >
        <Triangle size={10} />
        <span>{title}</span>
      </CollapsibleTrigger_Shadcn_>
      <CollapsibleContent_Shadcn_ {...props} />
    </Collapsible_Shadcn_>
  )
}

export default BlogCollapsible
