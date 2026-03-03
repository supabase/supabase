'use client'

import { File } from 'lucide-react'
import { useState } from 'react'
import { CodeBlock, flattenTree, TreeView, TreeViewItem } from 'ui'

import { RegistryNode } from '@/lib/process-registry'

interface BlockItemCodeProps {
  files: RegistryNode[]
}

interface TreeNode {
  name: string
  children: TreeNode[]
  metadata: { path: string }
}

const flattenChildren = (files: RegistryNode[]): TreeNode[] => {
  return files.map(
    (node): TreeNode => ({
      name: node.name,
      children: node.children ? flattenChildren(node.children) : [],
      metadata: { path: node.path },
    })
  )
}

const findFirstFile = (nodes: RegistryNode[]): RegistryNode | null => {
  for (const node of nodes) {
    if (node.type === 'file') {
      return node
    }
    if (node.children) {
      const foundFile = findFirstFile(node.children)
      if (foundFile) {
        return foundFile
      }
    }
  }
  return null
}

export function BlockItemCode({ files }: BlockItemCodeProps) {
  // Find the first file to select by default
  const [selectedFile, setSelectedFile] = useState<RegistryNode | null>(findFirstFile(files))
  const flattenedData = flattenTree({ name: '', children: flattenChildren(files) })

  // Handle file selection from the TreeView
  const handleNodeSelect = (element: any) => {
    const findFileByPath = (nodes: RegistryNode[], path: string): RegistryNode | null => {
      for (const node of nodes) {
        if (node.path === path) {
          return node
        }
        if (node.children) {
          const found = findFileByPath(node.children, path)
          if (found) {
            return found
          }
        }
      }
      return null
    }

    const filePath = element.metadata.path
    const foundFile = findFileByPath(files, filePath)

    if (foundFile?.type === 'directory') return

    setSelectedFile(foundFile || null)
  }

  return (
    <div className="flex mt-4 border rounded-lg overflow-hidden h-[652px] not-prose">
      {/* File browser sidebar */}
      <div className="w-64 grow-0 shrink-0 flex-0 py-2 border-r bg-muted/30 overflow-y-auto">
        <TreeView
          data={flattenedData}
          aria-label="file browser"
          className="w-full"
          defaultExpandedIds={flattenedData.filter((n) => n.children?.length).map((n) => n.id)}
          defaultSelectedIds={flattenedData
            .filter((n) => n.metadata?.path === selectedFile?.path)
            .map((n) => n.id)}
          onNodeSelect={({ element }) => handleNodeSelect(element)}
          nodeRenderer={({ element, isBranch, isExpanded, getNodeProps, level, isSelected }) => (
            <TreeViewItem
              {...getNodeProps()}
              isExpanded={isExpanded}
              isBranch={isBranch}
              isSelected={isSelected}
              level={level}
              icon={<File strokeWidth={1.5} size={16} className="shrink-0" />}
              name={element.name}
              className="gap-1.5"
            />
          )}
        />
      </div>

      {/* Code display area */}
      {selectedFile?.content ? (
        <CodeBlock
          wrapperClassName="w-full"
          className="h-full max-w-none !w-full flex-1 font-mono text-xs rounded-none border-none"
          language="ts"
        >
          {selectedFile?.content}
        </CodeBlock>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <p>No file selected or file content unavailable</p>
          </div>
        </div>
      )}
    </div>
  )
}
