import { useArgs } from '@storybook/preview-api'
import { StoryObj } from '@storybook/react'
import React from 'react'
import { flattenTree } from 'react-accessible-treeview'
import { TreeView, TreeViewItem } from './TreeView'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
export default {
  title: 'Primitives/TreeView',
  component: TreeView,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
}

// export default meta

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
// export const Primary = {
//   args: {
//     size: 'small',
//     // visible: true,
//   },
// }

type Story = StoryObj<typeof TreeView>

export const Primary: Story = {
  args: {},
  /**
   * 👇 To avoid linting issues, it is recommended to use a function with a capitalized name.
   * If you are not concerned with linting, you may use an arrow function.
   */
  render: function Render(args) {
    const folder = {
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

    const data = flattenTree(folder)

    return (
      <div className="bg-studio border-l border-r">
        <div className="directory">
          <TreeView
            className="w-[420px] h-[520px]"
            data={data}
            aria-label="directory tree"
            nodeRenderer={({ element, isBranch, isExpanded, getNodeProps, level, isSelected }) => (
              <TreeViewItem
                isExpanded={isExpanded}
                isBranch={isBranch}
                isSelected={isSelected}
                level={level}
                xPadding={16}
                {...getNodeProps()}
              >
                {element.name}
              </TreeViewItem>
            )}
          />
        </div>
      </div>
    )
  },
}
