import { TreeView, TreeViewItem } from 'ui'
import { flattenTree } from 'react-accessible-treeview'

export default function TreeViewDemo() {
  const data = {
    name: '',
    children: [
      {
        name: 'Current batch',
        children: [{ name: 'index.js' }, { name: 'styles.css' }],
      },
      {
        name: 'Older queries',
        children: [
          {
            name: 'all countries',
          },
          {
            name: 'add new countries',
          },
          {
            name: 'regions',
          },
          {
            name: 'regions by customer',
          },
        ],
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
      className="w-[420px]"
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
