import { Children, isValidElement, type PropsWithChildren } from 'react'
import { cn, TabsList, Tabs as TabsRoot, TabsTrigger } from 'ui'

interface CodeTabPanelProps {
  id: string
  label?: string
}

export function NamedCodeBlock({ name, children }: PropsWithChildren<{ name: string }>) {
  return (
    <div
      className={cn(
        'shiki-wrapper w-full isolate',
        '[&_.shiki]:rounded-tl-none [&_.shiki]:my-0!',
        '[&_.shiki_.code-scroll]:rounded-tl-none'
      )}
    >
      <span
        className={cn(
          'relative z-1 -mb-px flex w-fit items-center px-3 py-2',
          'rounded-t-lg border border-b-0 border-default bg-200',
          'text-xs text-foreground'
        )}
      >
        {name}
      </span>
      {children}
    </div>
  )
}

export function CodeTabs({ children }: PropsWithChildren) {
  const tabs = Children.toArray(children).filter(isValidElement<CodeTabPanelProps>)

  return (
    <TabsRoot
      defaultValue={tabs[0]?.props.id}
      className={cn(
        'shiki-wrapper w-full isolate [&_.shiki]:my-0!',
        'has-[[role=tab]:first-child[data-state=active]]:[&_.shiki]:rounded-tl-none',
        'has-[[role=tab]:first-child[data-state=active]]:[&_.shiki_.code-scroll]:rounded-tl-none'
      )}
    >
      <TabsList className="not-prose relative z-1 -mb-px border-b-0 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.props.id}
            value={tab.props.id}
            className={cn(
              'rounded-t-lg border border-b-0 border-transparent px-3 py-2 text-xs',
              'data-[state=active]:border-default data-[state=active]:bg-200',
              'data-[state=active]:shadow-none'
            )}
          >
            {tab.props.label ?? tab.props.id}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </TabsRoot>
  )
}
