'use client'

import { File } from 'lucide-react'
import { useMemo } from 'react'
import { flattenTree, TreeView, TreeViewItem } from 'ui'

import { buildFilePathTree } from '../lib/file-tree'

interface FileTreeSidebarProps {
  filePaths: string[]
  activeFilePath: string | null
  onActiveFilePathChange: (path: string) => void
}

export function FileTreeSidebar({
  filePaths,
  activeFilePath,
  onActiveFilePathChange,
}: FileTreeSidebarProps) {
  const flattenedData = useMemo(() => flattenTree(buildFilePathTree(filePaths)), [filePaths])

  const defaultExpandedIds = useMemo(
    () => flattenedData.filter((node) => node.children?.length).map((node) => node.id),
    [flattenedData]
  )

  const selectedIds = useMemo(
    () =>
      flattenedData.filter((node) => node.metadata?.path === activeFilePath).map((node) => node.id),
    [activeFilePath, flattenedData]
  )

  return (
    <TreeView
      data={flattenedData}
      aria-label="Generated files"
      className="w-full py-1"
      defaultExpandedIds={defaultExpandedIds}
      selectedIds={selectedIds}
      onNodeSelect={({ element }) => {
        const path = element.metadata?.path

        if (typeof path !== 'string') return

        onActiveFilePathChange(path)
      }}
      nodeRenderer={({ element, isBranch, isExpanded, getNodeProps, level }) => {
        const path = element.metadata?.path
        const isActive = Boolean(path && path === activeFilePath)

        return (
          <TreeViewItem
            {...getNodeProps()}
            isExpanded={isExpanded}
            isBranch={isBranch}
            isSelected={false}
            level={level}
            levelPadding={14}
            xPadding={8}
            icon={isBranch ? undefined : <File strokeWidth={1.5} size={14} className="shrink-0" />}
            name={element.name}
            className={
              isActive
                ? 'h-6 min-h-6 gap-1 py-0 font-mono text-xs [&_span]:text-xs bg-muted text-foreground hover:bg-muted'
                : 'h-6 min-h-6 gap-1 py-0 font-mono text-xs [&_span]:text-xs'
            }
          />
        )
      }}
    />
  )
}
