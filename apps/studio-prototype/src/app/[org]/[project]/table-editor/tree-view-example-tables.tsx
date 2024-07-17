import { MoreVertical, Table2 } from 'lucide-react'
import { flattenTree } from 'react-accessible-treeview'
import { TreeView, TreeViewItem, cn } from 'ui'

export function TreeViewExampleTables() {
  const data = {
    name: '',
    children: [
      {
        name: 'query all users',
      },
      {
        name: 'users in last day',
      },
      {
        name: 'new users over time',
      },
      {
        name: 'new users over time',
      },
      {
        name: 'new users over time',
      },
      {
        name: 'new users over time',
      },
      {
        name: 'new users over time',
      },
      {
        name: 'new users over time',
      },
      {
        name: 'new users over time',
      },
    ],
  }

  return (
    <TreeView
      data={flattenTree(data)}
      aria-label="directory tree"
      nodeRenderer={({ element, isBranch, isExpanded, getNodeProps, level, isSelected }) => (
        <TreeViewItem
          isExpanded={isExpanded}
          isBranch={isBranch}
          isSelected={isSelected}
          level={level}
          xPadding={16}
          name={element.name}
          style={{
            paddingLeft: 16,
          }}
          icon={
            <Table2
              className={cn(
                'transition-colors',
                'text-foreground-muted',
                'group-aria-selected:text-foreground',
                'w-4 h-4',
                '-ml-0.5'
              )}
              size={14}
              strokeWidth={1.5}
            />
          }
          {...getNodeProps()}
        >
          <div className="flex grow justify-end pr-2">
            <MoreVertical
              className="opacity-0 group-hover/tree-view-item:opacity-100 text-foreground-light hover:text-foreground"
              size={14}
              strokeWidth={1}
            />
          </div>
        </TreeViewItem>
      )}
    />
  )
}
