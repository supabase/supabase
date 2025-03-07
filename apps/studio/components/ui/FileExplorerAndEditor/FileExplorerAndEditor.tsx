import { Edit, File, Plus, Trash } from 'lucide-react'
import { useEffect, useState } from 'react'

import AIEditor from 'components/ui/AIEditor'
import {
  Button,
  ContextMenu_Shadcn_,
  ContextMenuContent_Shadcn_,
  ContextMenuItem_Shadcn_,
  ContextMenuSeparator_Shadcn_,
  ContextMenuTrigger_Shadcn_,
  flattenTree,
  TreeView,
  TreeViewItem,
} from 'ui'

interface FileData {
  id: number
  name: string
  content: string
  selected?: boolean
}

interface FileExplorerAndEditorProps {
  files: FileData[]
  onFilesChange: (files: FileData[]) => void
  aiEndpoint?: string
  aiMetadata?: {
    projectRef?: string
    connectionString?: string
    includeSchemaMetadata?: boolean
  }
}

const getLanguageFromFileName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'js':
    case 'jsx':
      return 'javascript'
    case 'json':
      return 'json'
    case 'html':
      return 'html'
    case 'css':
      return 'css'
    case 'md':
      return 'markdown'
    default:
      return 'typescript' // Default to typescript
  }
}

const FileExplorerAndEditor = ({
  files,
  onFilesChange,
  aiEndpoint,
  aiMetadata,
}: FileExplorerAndEditorProps) => {
  const selectedFile = files.find((f) => f.selected) ?? files[0]

  const [treeData, setTreeData] = useState({
    name: '',
    children: files.map((file) => ({
      id: file.id.toString(),
      name: file.name,
      metadata: {
        isEditing: false,
        originalId: file.id,
      },
    })),
  })

  const handleChange = (value: string) => {
    const updatedFiles = files.map((file) =>
      file.id === selectedFile.id ? { ...file, content: value } : file
    )
    onFilesChange(updatedFiles)
  }

  const addNewFile = () => {
    const newId = Math.max(...files.map((f) => f.id)) + 1
    const updatedFiles = files.map((f) => ({ ...f, selected: false }))
    onFilesChange([
      ...updatedFiles,
      {
        id: newId,
        name: `file${newId}.ts`,
        content: '',
        selected: true,
      },
    ])
  }

  const handleFileNameChange = (id: number, newName: string) => {
    if (!newName.trim()) return // Don't allow empty names
    const updatedFiles = files.map((file) => (file.id === id ? { ...file, name: newName } : file))
    onFilesChange(updatedFiles)
  }

  const handleFileDelete = (id: number) => {
    if (files.length <= 1) {
      // Don't allow deleting the last file
      return
    }

    const fileToDelete = files.find((f) => f.id === id)
    const isSelected = fileToDelete?.selected

    const updatedFiles = files.filter((file) => file.id !== id)

    // If the deleted file was selected, select another file
    if (isSelected && updatedFiles.length > 0) {
      updatedFiles[0].selected = true
    }

    onFilesChange(updatedFiles)
  }

  const handleFileSelect = (id: number) => {
    const updatedFiles = files.map((file) => ({
      ...file,
      selected: file.id === id,
    }))
    onFilesChange(updatedFiles)
  }

  const handleStartRename = (id: number) => {
    const updatedTreeData = {
      name: '',
      children: files.map((file) => ({
        id: file.id.toString(),
        name: file.name,
        metadata: {
          isEditing: file.id === id,
          originalId: file.id,
        },
      })),
    }

    // Force re-render of the TreeView with the updated metadata
    setTreeData(updatedTreeData)
  }

  // Update treeData when files change
  useEffect(() => {
    setTreeData({
      name: '',
      children: files.map((file) => ({
        id: file.id.toString(),
        name: file.name,
        metadata: {
          isEditing: false,
          originalId: file.id,
        },
      })),
    })
  }, [files])

  return (
    <div className="flex-1 overflow-hidden flex h-full">
      <div className="w-64 border-r bg-surface-200 flex flex-col">
        <div className="py-4 px-6 border-b flex items-center justify-between">
          <h3 className="text-sm font-normal font-mono uppercase text-lighter tracking-wide">
            Files
          </h3>
          <Button size="tiny" type="default" icon={<Plus size={14} />} onClick={addNewFile}>
            Add File
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <TreeView
            data={flattenTree(treeData)}
            aria-label="files tree"
            nodeRenderer={({ element, isBranch, isExpanded, getNodeProps, level }) => {
              const nodeProps = getNodeProps()
              const originalId =
                typeof element.metadata?.originalId === 'number'
                  ? element.metadata.originalId
                  : null

              return (
                <ContextMenu_Shadcn_ modal={false}>
                  <ContextMenuTrigger_Shadcn_ asChild>
                    <div>
                      <TreeViewItem
                        {...nodeProps}
                        isExpanded={isExpanded}
                        isBranch={isBranch}
                        isSelected={files.find((f) => f.id === originalId)?.selected}
                        level={level}
                        xPadding={16}
                        name={element.name}
                        icon={<File size={14} className="text-foreground-light" />}
                        isEditing={Boolean(element.metadata?.isEditing)}
                        onEditSubmit={(value) => {
                          if (originalId !== null) handleFileNameChange(originalId, value)
                        }}
                        onClick={() => {
                          if (originalId !== null) handleFileSelect(originalId)
                        }}
                      />
                    </div>
                  </ContextMenuTrigger_Shadcn_>
                  <ContextMenuContent_Shadcn_ onCloseAutoFocus={(e) => e.stopPropagation()}>
                    <ContextMenuItem_Shadcn_
                      className="gap-x-2"
                      onSelect={() => {
                        if (originalId !== null) handleStartRename(originalId)
                      }}
                      onFocusCapture={(e) => e.stopPropagation()}
                    >
                      <Edit size={14} />
                      Rename file
                    </ContextMenuItem_Shadcn_>

                    {files.length > 1 && (
                      <>
                        <ContextMenuSeparator_Shadcn_ />
                        <ContextMenuItem_Shadcn_
                          className="gap-x-2"
                          onSelect={() => {
                            if (originalId !== null) handleFileDelete(originalId)
                          }}
                          onFocusCapture={(e) => e.stopPropagation()}
                        >
                          <Trash size={14} />
                          Delete file
                        </ContextMenuItem_Shadcn_>
                      </>
                    )}
                  </ContextMenuContent_Shadcn_>
                </ContextMenu_Shadcn_>
              )
            }}
          />
        </div>
      </div>
      <div className="flex-1 min-h-0 relative px-3 bg-surface-200">
        <AIEditor
          language={getLanguageFromFileName(selectedFile?.name || 'index.ts')}
          value={selectedFile?.content}
          onChange={handleChange}
          aiEndpoint={aiEndpoint}
          aiMetadata={aiMetadata}
          options={{
            tabSize: 2,
            fontSize: 12,
            minimap: { enabled: false },
            wordWrap: 'on',
            lineNumbers: 'on',
            folding: false,
            padding: { top: 20, bottom: 20 },
            lineNumbersMinChars: 3,
          }}
        />
      </div>
    </div>
  )
}

export default FileExplorerAndEditor
