import { Children, isValidElement, type PropsWithChildren } from 'react'
import { cn, TabsIndicator, TabsList, Tabs as TabsRoot, TabsTrigger } from 'ui'

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
          'text-xs text-foreground',
          'after:absolute after:bottom-0 after:-right-2 after:size-2',
          'after:bg-(image:--tab-flare-right)'
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
      className="group/code-tabs shiki-wrapper w-full isolate [&_.shiki]:my-0!"
    >
      <TabsList
        className={cn(
          'not-prose relative z-1 -mb-px border-b-0 overflow-x-auto no-scrollbar has-focus-visible:z-2',
          'has-[[data-tab-indicator]]:after:hidden'
        )}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.props.id}
            value={tab.props.id}
            className="relative z-1 rounded-md py-2 text-xs data-[state=active]:shadow-none"
          >
            <span className="px-3">{tab.props.label ?? tab.props.id}</span>
          </TabsTrigger>
        ))}
        <TabsIndicator
          className={cn(
            'top-0 h-auto rounded-t-lg border border-b-0 border-default bg-200',
            'before:absolute before:bottom-0 before:-left-2 before:size-2',
            'before:transition-opacity before:duration-150 before:ease-move motion-reduce:before:transition-none',
            'group-has-[[role=tab]:first-child[data-state=active]]/code-tabs:before:opacity-0',
            'before:bg-(image:--tab-flare-left)',
            'after:absolute after:bottom-0 after:-right-2 after:size-2',
            'after:bg-(image:--tab-flare-right)'
          )}
        />
      </TabsList>
      <span aria-hidden className="relative z-1 block h-0">
        <span
          className={cn(
            'absolute left-0 top-0 size-2 border-l border-default bg-200 opacity-0',
            'transition-opacity duration-150 ease-move motion-reduce:transition-none',
            'group-has-[[role=tab]:first-child[data-state=active]]/code-tabs:opacity-100',
            'group-has-[[role=tab]:first-child[data-state=active]]/code-tabs:duration-400'
          )}
        />
      </span>
      {children}
    </TabsRoot>
  )
}
