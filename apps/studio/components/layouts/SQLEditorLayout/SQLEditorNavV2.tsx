import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  TreeView,
  TreeViewItem,
  flattenTree,
} from 'ui'

export const SQLEditorNavV2 = () => {
  const MOCK_DATA = {
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
      data={flattenTree(MOCK_DATA)}
      className=""
      aria-label="directory tree"
      nodeRenderer={({ element, isBranch, isExpanded, getNodeProps, level, isSelected }) => (
        <ContextMenu modal={false}>
          <ContextMenuTrigger asChild>
            <TreeViewItem
              level={level}
              xPadding={0}
              name={element.name}
              isExpanded={isExpanded}
              isBranch={isBranch}
              isSelected={isSelected}
              isEditing={element.metadata?.isEditing === true}
              // onEditSubmit={(value) => {
              //   let updatedTreeData = { ...treeData }
              //   const findNode = (node: any) => {
              //     if (node.id === element.id) {
              //       node.name = value
              //       node.metadata = { isEditing: false }
              //     }
              //     if (node.children) {
              //       node.children.forEach(findNode)
              //     }
              //   }
              //   updatedTreeData.children.forEach(findNode)
              //   setDataTreeState(updatedTreeData)
              // }}
              {...getNodeProps()}
            />
          </ContextMenuTrigger>
          <ContextMenuContent onCloseAutoFocus={(e) => e.stopPropagation()}>
            <ContextMenuItem onSelect={(e) => {}} onFocusCapture={(e) => e.stopPropagation()}>
              Rename
            </ContextMenuItem>
            <ContextMenuItem disabled>Open in new tab</ContextMenuItem>
            <ContextMenuItem disabled>Share with team</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem disabled>Delete</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )}
    />
  )
}

export default SQLEditorNavV2
