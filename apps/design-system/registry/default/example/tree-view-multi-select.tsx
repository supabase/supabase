import { useState } from 'react'
import { TreeView, TreeViewItem } from 'ui'
import { flattenTree } from 'react-accessible-treeview'
import {
  ContextMenu_Shadcn_,
  ContextMenuContent_Shadcn_,
  ContextMenuItem_Shadcn_,
  ContextMenuSeparator_Shadcn_,
  ContextMenuTrigger_Shadcn_,
} from 'ui'

const data = {
  name: 'basic tree',
  children: [
    // {
    //   id: 0,
    //   name: 'Current batch',
    //   children: [
    //     // { id: 2, name: 'index.js' },
    //     // { id: 3, name: 'styles.css' },
    //   ],
    // },
    // {
    //   id: 4,
    //   name: 'Older queries',
    //   children: [
    //     {
    //       id: 5,
    //       name: 'all countries',
    //     },
    //     {
    //       id: 6,
    //       name: 'add new countries',
    //     },
    //     {
    //       id: 7,
    //       name: 'regions',
    //     },
    //     {
    //       id: 8,
    //       name: 'regions by customer',
    //     },
    //   ],
    // },
    {
      id: 'c3c5b103-aaa3-488b-b21c-0eb20a18c5d9',
      // id: 2,
      name: 'Countries Table',
    },
    {
      id: '3bc20d85-2bd5-4476-90f9-ab6b05a7ca11',
      // id: 3,
      name: 'User Management Starter',
    },
    {
      id: '75bce832-16c6-4fda-879b-46d2e1a57e45',
      // id: 4,
      name: 'Countries Table',
    },
    {
      id: '7d1cc53f-9bef-4b08-af34-54583f5b5e32',
      // id: 5,
      name: 'Query II',
    },
    {
      id: '4d8e6085-5f6f-47c9-9c62-b98ba554dbbd',
      // id: 6,
      name: 'Joshen Query',
    },
    {
      id: 'f7b33559-f94a-4dd9-829b-4108900d52f9',
      // id: 7,
      name: 'Slack Clone',
    },
    {
      id: 'be4a8fb0-c89d-4004-a536-de96952a7908',
      // id: 8,
      name: 'Create table',
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
