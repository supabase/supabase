'use client'

import { File, Folder } from 'lucide-react'
import { cn } from 'ui'

import { type FileTreeNode } from '../lib/file-tree'

function TreeRow({ node, depth }: { node: FileTreeNode; depth: number }) {
  const isDir = Boolean(node.dir)
  return (
    <>
      <div
        className="flex items-center gap-2 py-1 pr-3 font-mono text-[12.8px] text-foreground-light"
        style={{ paddingLeft: 10 + depth * 18 }}
      >
        <span
          className={cn(
            'grid flex-none place-items-center',
            node.status === 'new' ? 'text-brand' : 'text-foreground-light'
          )}
        >
          {isDir ? <Folder size={15} /> : <File size={14} />}
        </span>
        <span className="text-foreground">
          {node.name}
          {isDir ? '/' : ''}
        </span>
        {node.note && (
          <span className="font-sans text-[11.5px] text-foreground-light">{node.note}</span>
        )}
        {node.status && (
          <span
            className={cn(
              'ml-auto rounded-full px-1.5 py-px font-sans text-[10.5px]',
              node.status === 'new'
                ? 'bg-brand-200 text-brand-600'
                : 'bg-warning-200 text-warning-600'
            )}
          >
            {node.status === 'new' ? 'new' : 'edit'}
          </span>
        )}
      </div>
      {isDir &&
        node.children?.map((child, i) => <TreeRow key={i} node={child} depth={depth + 1} />)}
    </>
  )
}

export function FileTree({ tree }: { tree: FileTreeNode }) {
  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-default bg-surface-75">
      <div className="flex items-center gap-2 border-b border-default px-3.5 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-surface-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-surface-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-surface-300" />
        <span className="ml-2 font-mono text-[11.5px] text-foreground-light">
          files this setup touches
        </span>
      </div>
      <div className="px-1.5 py-2">
        <TreeRow node={tree} depth={0} />
      </div>
    </div>
  )
}
