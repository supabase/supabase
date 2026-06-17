export interface FileTreeNode {
  name: string
  children?: FileTreeNode[]
  metadata?: { path: string }
}

export function buildFilePathTree(filePaths: string[]): { name: string; children: FileTreeNode[] } {
  const root: { name: string; children: FileTreeNode[] } = { name: '', children: [] }
  const sortedPaths = [...filePaths].sort((a, b) => a.localeCompare(b))

  for (const filePath of sortedPaths) {
    const segments = filePath.split('/').filter(Boolean)
    let current = root

    segments.forEach((segment, index) => {
      const isFile = index === segments.length - 1
      current.children ??= []

      let node = current.children.find((child) => child.name === segment)

      if (!node) {
        node = isFile
          ? { name: segment, metadata: { path: filePath } }
          : { name: segment, children: [] }
        current.children.push(node)
      } else if (isFile) {
        node.metadata = { path: filePath }
      }

      if (!isFile) {
        node.children ??= []
        current = node as { name: string; children: FileTreeNode[] }
      }
    })
  }

  return root
}
