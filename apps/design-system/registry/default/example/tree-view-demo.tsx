import { flattenTree, TreeView, TreeViewItem } from 'ui'

export default function TreeViewDemo() {
  const data = {
    name: '',
    children: [
      {
        name: 'Current batch',
      },
      {
        name: 'Older queries',
      },
      {
        name: 'query all users',
      },
      {
        name: 'users in last day',
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
      className="w-[420px] border bg py-2"
      nodeRenderer={({ element, isBranch, isExpanded, getNodeProps, level, isSelected }) => (
        <TreeViewItem
          isExpanded={isExpanded}
          isBranch={isBranch}
          isSelected={isSelected}
          level={level}
          xPadding={16}
          name={element.name}
          {...getNodeProps()}
        />
      )}
    />
  )
}
