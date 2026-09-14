'use client'

import { File } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { cn, flattenTree, TreeView, TreeViewItem } from 'ui'
import type { CodeBlockLang } from 'ui-patterns/CodeBlock'

import { RegistryNode } from '@/lib/process-registry'

const CodeBlock = dynamic(
  () => import('ui-patterns/CodeBlock').then((module) => module.CodeBlock),
  {
    ssr: false,
    loading: () => (
      <div role="status" className="p-4 text-xs text-foreground-lighter">
        Loading code preview...
      </div>
    ),
  }
)

interface BlockItemCodeProps {
  files: RegistryNode[]
  embedded?: boolean
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

const LANGUAGES: Record<string, CodeBlockLang> = {
  bash: 'bash',
  html: 'html',
  js: 'js',
  json: 'json',
  jsx: 'jsx',
  sh: 'bash',
  sql: 'sql',
  toml: 'toml',
  yaml: 'yaml',
  yml: 'yaml',
}

const languageFor = (fileName: string | undefined): CodeBlockLang => {
  const normalized = fileName?.toLowerCase() ?? ''
  if (normalized.startsWith('.env')) return 'bash'
  if (normalized === 'deno.lock') return 'json'

  return LANGUAGES[normalized.split('.').pop() ?? ''] ?? 'ts'
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

export function BlockItemCode({ files, embedded = false }: BlockItemCodeProps) {
  // Find the first file to select by default
  const [selectedFile, setSelectedFile] = useState<RegistryNode | null>(findFirstFile(files))
  const flattenedData = flattenTree({ name: '', children: flattenChildren(files) })

  // Handle file selection from the TreeView
  const handleNodeSelect = (filePath: string) => {
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

    const foundFile = findFileByPath(files, filePath)

    if (foundFile?.type === 'directory') return

    setSelectedFile(foundFile || null)
  }

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row overflow-hidden not-prose',
        embedded ? 'h-full' : 'mt-4 border rounded-lg h-[652px]'
      )}
    >
      {/* File browser sidebar */}
      <div className="h-44 w-full shrink-0 overflow-auto border-b bg-muted/30 py-2 sm:h-full sm:w-64 sm:border-b-0 sm:border-r">
        <TreeView
          data={flattenedData}
          aria-label="file browser"
          className="w-full"
          defaultExpandedIds={flattenedData.filter((n) => n.children?.length).map((n) => n.id)}
          defaultSelectedIds={flattenedData
            .filter((n) => n.metadata?.path === selectedFile?.path)
            .map((n) => n.id)}
          onNodeSelect={({ element }) => {
            if (typeof element.metadata?.path === 'string') {
              handleNodeSelect(element.metadata.path)
            }
          }}
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
          wrapperClassName="w-full min-h-0 min-w-0 flex-1"
          className="h-full max-w-none w-full! flex-1 font-mono text-xs rounded-none border-none"
          language={languageFor(selectedFile.name)}
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
