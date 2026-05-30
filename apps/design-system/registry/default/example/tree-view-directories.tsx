import { flattenTree, TreeView, TreeViewItem } from 'ui'

export default function TreeViewDemo() {
  const data = {
    name: '',
    children: [
      {
        name: 'Active Projects',
        children: [{ name: 'main.js' }, { name: 'styles.css' }],
      },
      {
        name: 'Archived Queries',
        children: [
          {
            name: 'Historical Data',
            children: [
              {
                name: 'Country Statistics',
              },
              {
                name: 'Add New Countries',
              },
              {
                name: 'Regional Insights',
              },
              {
                name: 'Customer-Specific Regions',
              },
            ],
          },
          {
            name: 'Previous Queries',
            children: [
              {
                name: 'Country Statistics',
                children: [
                  {
                    name: 'Country Overview',
                  },
                  {
                    name: 'Add New Countries',
                  },
                  {
                    name: 'Regional Insights',
                  },
                  {
                    name: 'Customer-Specific Regions',
                  },
                ],
              },
              {
                name: 'Country Overview',
              },
              {
                name: 'Add New Countries',
              },
              {
                name: 'Regional Insights',
              },
              {
                name: 'Customer-Specific Regions',
              },
            ],
          },
          {
            name: 'Country Overview',
          },
          {
            name: 'Add New Countries',
          },
          {
            name: 'Regional Insights',
          },
          {
            name: 'Customer-Specific Regions',
          },
        ],
      },
      {
        name: 'User Query Logs',
      },
      {
        name: 'Recent User Activity',
      },
      {
        name: 'User Growth Trends',
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
          name={element.name}
          {...getNodeProps()}
        />
      )}
    />
  )
}
