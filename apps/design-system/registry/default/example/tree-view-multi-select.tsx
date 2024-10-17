import { useState } from 'react'
import {
  ContextMenu_Shadcn_,
  ContextMenuContent_Shadcn_,
  ContextMenuItem_Shadcn_,
  ContextMenuSeparator_Shadcn_,
  ContextMenuTrigger_Shadcn_,
  flattenTree,
  TreeView,
  TreeViewItem,
} from 'ui'

const data = {
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
}

export default function TreeViewDemo() {
  const [treeData, setDataTreeState] = useState(data)

  function handleRenameSelect(id: number) {
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
      data={flattenTree(data)}
      aria-label="directory tree"
      togglableSelect
      clickAction="EXCLUSIVE_SELECT"
      multiSelect
      nodeRenderer={({ element, isBranch, isExpanded, getNodeProps, level, isSelected }) => {
        return (
          <ContextMenu_Shadcn_ modal={false}>
            <ContextMenuTrigger_Shadcn_ asChild>
              <TreeViewItem
                isExpanded={isExpanded}
                isBranch={isBranch}
                isSelected={isSelected}
                level={level}
                xPadding={16}
                name={element.name}
                isEditing={element.metadata?.isEditing === true}
                onEditSubmit={(value) => {
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
            </ContextMenuTrigger_Shadcn_>
            <ContextMenuContent_Shadcn_
              onCloseAutoFocus={(e) => {
                // stop focus propagation
                // so input in TreeViewItem gets focus
                e.stopPropagation()
              }}
            >
              <ContextMenuItem_Shadcn_
                onSelect={(e) => {
                  handleRenameSelect(element.id as number)
                }}
                onFocusCapture={(e) => {
                  // stop focus propagation
                  // so input in TreeViewItem gets focus
                  e.stopPropagation()
                }}
              >
                Rename
              </ContextMenuItem_Shadcn_>
              <ContextMenuItem_Shadcn_ disabled>Open in new tab</ContextMenuItem_Shadcn_>
              <ContextMenuItem_Shadcn_ disabled>Share with team</ContextMenuItem_Shadcn_>
              <ContextMenuSeparator_Shadcn_ />
              <ContextMenuItem_Shadcn_ disabled>Delete</ContextMenuItem_Shadcn_>
            </ContextMenuContent_Shadcn_>
          </ContextMenu_Shadcn_>
        )
      }}
    />
  )
}
