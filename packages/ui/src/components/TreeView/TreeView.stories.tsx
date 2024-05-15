import { StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import { flattenTree } from 'react-accessible-treeview'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../shadcn/ui/context-menu'
import { TreeView, TreeViewItem } from './TreeView'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
export default {
  title: 'Primitives/TreeView',
  component: TreeView,
  subcomponents: { TreeViewItem },
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  decorators: [
    (Story: any) => {
      return (
        <div className="bg-studio border-l border-r">
          <Story />
        </div>
      )
    },
  ],
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    data: {},
  },
}

type Story = StoryObj<
  // Omit data so raw data can be passed to the story
  Omit<typeof TreeView, 'data'> & { data: any; className?: string }
>

export const DefaultFlatTree: Story = {
  args: {
    className: 'w-[420px] h-[520px]',
    data: {
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
    },
  },
  /**
   * 👇 To avoid linting issues, it is recommended to use a function with a capitalized name.
   * If you are not concerned with linting, you may use an arrow function.
   */
  render: function Render(args) {
    return (
      <TreeView
        {...args}
        data={flattenTree(args.data)}
        aria-label="directory tree"
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
  },
}

export const WithDirectories: Story = {
  args: {
    className: 'w-[420px] h-[520px]',
    data: {
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
    },
  },
  /**
   * 👇 To avoid linting issues, it is recommended to use a function with a capitalized name.
   * If you are not concerned with linting, you may use an arrow function.
   */
  render: function Render(args) {
    return (
      <TreeView
        {...args}
        data={flattenTree(args.data)}
        aria-label="directory tree"
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
  },
}
export const withEditEntity: Story = {
  args: {
    className: 'w-[420px] h-[520px]',
    data: {
      name: 'basic tree',
      children: [
        {
          id: 1,
          name: 'Current batch',
          children: [
            { id: 2, name: 'index.js' },
            { id: 3, name: 'styles.css' },
          ],
        },
        {
          id: 4,
          name: 'Older queries',
          children: [
            {
              id: 5,
              name: 'all countries',
            },
            {
              id: 6,
              name: 'add new countries',
            },
            {
              id: 7,
              name: 'regions',
            },
            {
              id: 8,
              name: 'regions by customer',
            },
          ],
        },
        {
          id: 9,
          name: 'query all users',
        },
        {
          id: 10,
          name: 'users in last day',
        },
        {
          id: 11,
          name: 'new users over time',
        },
      ],
    },
  },
  /**
   * 👇 To avoid linting issues, it is recommended to use a function with a capitalized name.
   * If you are not concerned with linting, you may use an arrow function.
   */
  render: function Render(args) {
    const [treeData, setDataTreeState] = useState(args.data)

    function handleRenameSelect(id) {
      // find id in treeData and set it to edit mode
      let updatedTreeData = { ...treeData }
      const findNode = (node: any) => {
        if (node.id === id) {
          node.metadata = { isEditing: true }
        }
        if (node.children) {
          node.children.forEach(findNode)
        }
      }
      console.log(updatedTreeData)
      updatedTreeData.children.forEach(findNode)
      setDataTreeState(updatedTreeData)
    }

    return (
      <TreeView
        {...args}
        data={flattenTree(args.data)}
        aria-label="directory tree"
        nodeRenderer={({ element, isBranch, isExpanded, getNodeProps, level, isSelected }) => {
          return (
            <ContextMenu modal={false}>
              <ContextMenuTrigger asChild>
                <TreeViewItem
                  isExpanded={isExpanded}
                  isBranch={isBranch}
                  isSelected={isSelected}
                  level={level}
                  xPadding={16}
                  name={element.name}
                  isEditing={element.metadata?.isEditing === true}
                  onEditSubmit={(value) => {
                    console.log('value', value)
                    let updatedTreeData = { ...treeData }
                    const findNode = (node: any) => {
                      if (node.id === element.id) {
                        node.name = value
                        node.metadata = { isEditing: false }
                      }
                      if (node.children) {
                        node.children.forEach(findNode)
                      }
                    }
                    updatedTreeData.children.forEach(findNode)
                    setDataTreeState(updatedTreeData)
                  }}
                  {...getNodeProps()}
                />
              </ContextMenuTrigger>
              <ContextMenuContent
                onCloseAutoFocus={(e) => {
                  // stop focus propagation
                  // so input in TreeViewItem gets focus
                  e.stopPropagation()
                }}
              >
                <ContextMenuItem
                  onSelect={(e) => {
                    handleRenameSelect(element.id)
                  }}
                  onFocusCapture={(e) => {
                    // stop focus propagation
                    // so input in TreeViewItem gets focus
                    e.stopPropagation()
                  }}
                >
                  Rename
                </ContextMenuItem>
                <ContextMenuItem disabled>Open in new tab</ContextMenuItem>
                <ContextMenuItem disabled>Share with team</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem disabled>Delete</ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )
        }}
      />
    )
  },
}
export const withMultiSelect: Story = {
  args: {
    className: 'w-[420px] h-[520px]',
    multiselect: true,
    data: {
      name: 'basic tree',
      children: [
        {
          id: 1,
          name: 'Current batch',
          children: [
            { id: 2, name: 'index.js' },
            { id: 3, name: 'styles.css' },
          ],
        },
        {
          id: 4,
          name: 'Older queries',
          children: [
            {
              id: 5,
              name: 'all countries',
            },
            {
              id: 6,
              name: 'add new countries',
            },
            {
              id: 7,
              name: 'regions',
            },
            {
              id: 8,
              name: 'regions by customer',
            },
          ],
        },
        {
          id: 9,
          name: 'query all users',
        },
        {
          id: 10,
          name: 'users in last day',
        },
        {
          id: 11,
          name: 'new users over time',
        },
      ],
    },
  },
  /**
   * 👇 To avoid linting issues, it is recommended to use a function with a capitalized name.
   * If you are not concerned with linting, you may use an arrow function.
   */
  render: function Render(args) {
    const [treeData, setDataTreeState] = useState(args.data)

    function handleRenameSelect(id) {
      // find id in treeData and set it to edit mode
      let updatedTreeData = { ...treeData }
      const findNode = (node: any) => {
        if (node.id === id) {
          node.metadata = { isEditing: true }
        }
        if (node.children) {
          node.children.forEach(findNode)
        }
      }
      console.log(updatedTreeData)
      updatedTreeData.children.forEach(findNode)
      setDataTreeState(updatedTreeData)
    }

    return (
      <TreeView
        {...args}
        data={flattenTree(args.data)}
        aria-label="directory tree"
        nodeRenderer={({ element, isBranch, isExpanded, getNodeProps, level, isSelected }) => {
          return (
            <ContextMenu modal={false}>
              <ContextMenuTrigger asChild>
                <TreeViewItem
                  isExpanded={isExpanded}
                  isBranch={isBranch}
                  isSelected={isSelected}
                  level={level}
                  xPadding={16}
                  name={element.name}
                  isEditing={element.metadata?.isEditing === true}
                  onEditSubmit={(value) => {
                    console.log('value', value)
                    let updatedTreeData = { ...treeData }
                    const findNode = (node: any) => {
                      if (node.id === element.id) {
                        node.name = value
                        node.metadata = { isEditing: false }
                      }
                      if (node.children) {
                        node.children.forEach(findNode)
                      }
                    }
                    updatedTreeData.children.forEach(findNode)
                    setDataTreeState(updatedTreeData)
                  }}
                  {...getNodeProps()}
                />
              </ContextMenuTrigger>
              <ContextMenuContent
                onCloseAutoFocus={(e) => {
                  // stop focus propagation
                  // so input in TreeViewItem gets focus
                  e.stopPropagation()
                }}
              >
                <ContextMenuItem
                  onSelect={(e) => {
                    handleRenameSelect(element.id)
                  }}
                  onFocusCapture={(e) => {
                    // stop focus propagation
                    // so input in TreeViewItem gets focus
                    e.stopPropagation()
                  }}
                >
                  Rename
                </ContextMenuItem>
                <ContextMenuItem disabled>Open in new tab</ContextMenuItem>
                <ContextMenuItem disabled>Share with team</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem disabled>Delete</ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )
        }}
      />
    )
  },
}
