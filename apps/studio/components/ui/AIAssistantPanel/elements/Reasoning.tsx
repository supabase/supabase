import { BrainIcon, ChevronDownIcon, Loader2 } from 'lucide-react'
import type { ComponentProps } from 'react'
import { memo } from 'react'
import ReactMarkdown from 'react-markdown'

import {
  cn,
  Collapsible,
  CollapsibleContent_Shadcn_ as CollapsibleContent,
  CollapsibleTrigger_Shadcn_ as CollapsibleTrigger,
} from 'ui'

type ReasoningProps = Omit<ComponentProps<typeof Collapsible>, 'children'> & {
  isStreaming?: boolean
  children: string
}

export const Reasoning = memo(({ className, isStreaming, children, ...props }: ReasoningProps) => (
  <Collapsible
    className={cn('not-prose border rounded-md border-muted', className)}
    defaultOpen={false}
    {...props}
  >
    <CollapsibleTrigger
      className={cn(
        'flex items-center gap-2 text-foreground-lighter heading-meta px-3 py-2 w-full'
      )}
    >
      {isStreaming ? (
        <>
          <Loader2 strokeWidth={1.5} size={12} className="animate-spin" />
          <p>Thinking...</p>
        </>
      ) : (
        <>
          <BrainIcon strokeWidth={1.5} size={12} className="text-foreground-muted" />
          <p>Reasoned</p>
        </>
      )}
      <ChevronDownIcon strokeWidth={1.5} size={12} className="text-foreground-muted" />
    </CollapsibleTrigger>

    <CollapsibleContent
      className={cn('p-5 pt-2 text-xs leading-normal', 'max-h-64 overflow-y-auto')}
    >
      <ReactMarkdown>{children}</ReactMarkdown>
    </CollapsibleContent>
  </Collapsible>
))

Reasoning.displayName = 'Reasoning'
