'use client'

import { ChevronDown, File, Folder } from 'lucide-react'
import { useState } from 'react'
import {
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  flattenTree,
  TreeView,
  TreeViewItem,
  useIsMobile,
} from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'

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
  // On mobile the tree is collapsed by default so it doesn't take up the full width
  const [isTreeOpen, setIsTreeOpen] = useState(false)
  const isMobile = useIsMobile()
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
    // Reveal the code straight away instead of leaving the tree covering it
    if (isMobile) setIsTreeOpen(false)
  }

  return (
    <Collapsible
      open={!isMobile || isTreeOpen}
      onOpenChange={setIsTreeOpen}
      className="flex flex-col md:flex-row mt-4 border rounded-lg overflow-hidden h-[652px] not-prose"
    >
      {/* Trigger is mobile-only; from md up the tree is always visible */}
      <CollapsibleTrigger className="md:hidden flex shrink-0 items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2 text-sm">
        <span className="flex min-w-0 items-center gap-1.5">
          <Folder strokeWidth={1.5} size={16} className="shrink-0" />
          <span className="truncate">{selectedFile?.name ?? 'Folder structure'}</span>
        </span>
        <ChevronDown
          strokeWidth={1.5}
          size={16}
          className={cn('shrink-0 transition-transform', isTreeOpen && 'rotate-180')}
        />
      </CollapsibleTrigger>

      {/* File browser sidebar */}
      <CollapsibleContent className="shrink-0 md:h-full">
        <div className="w-full max-h-56 md:w-64 md:max-h-none md:h-full py-2 border-b md:border-b-0 md:border-r bg-muted/30 overflow-y-auto">
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
      </CollapsibleContent>

      {/* Code display area */}
      {selectedFile?.content ? (
        <CodeBlock
          wrapperClassName="w-full flex-1 min-h-0 min-w-0"
          className="h-full max-w-none w-full! flex-1 font-mono text-xs rounded-none border-none"
          language="ts"
        >
          {selectedFile?.content}
        </CodeBlock>
      ) : (
        <div className="flex flex-1 items-center justify-center h-full text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <p>No file selected or file content unavailable</p>
          </div>
        </div>
      )}
    </Collapsible>
  )
}
