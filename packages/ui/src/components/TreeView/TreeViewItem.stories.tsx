import { StoryObj } from '@storybook/react'
import React from 'react'
import { TreeViewItem } from './TreeView'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
export default {
  title: 'Primitives/TreeView',
  component: TreeViewItem,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
}

type Story = StoryObj<typeof TreeViewItem>

export const SingleItem: Story = {
  args: {
    isSelected: false,
    level: 1,
    xPadding: 16,
    isBranch: false,
    isExpanded: false,
    levelPadding: 16,
    name: 'Element name',
  },
  /**
   * 👇 To avoid linting issues, it is recommended to use a function with a capitalized name.
   * If you are not concerned with linting, you may use an arrow function.
   */
  render: function Render(args) {
    return <TreeViewItem {...args}>Element name</TreeViewItem>
  },
}
