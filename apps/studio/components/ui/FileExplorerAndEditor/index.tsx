import { AnimatePresence, motion } from 'framer-motion'
import { Edit, File, Plus, Trash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { AIEditor } from 'components/ui/AIEditor'
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
import {
  extractZipFile,
  getLanguageFromFileName,
  isBinaryFile,
  isZipFile,
} from './FileExplorerAndEditor.utils'

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
    connectionString?: string | null
    orgSlug?: string
  }
}

const denoJsonDefaultContent = JSON.stringify({ imports: {} }, null, '\t')

export const FileExplorerAndEditor = ({
  files,
  onFilesChange,
  aiEndpoint,
  aiMetadata,
}: FileExplorerAndEditorProps) => {
  const selectedFile = files.find((f) => f.selected) ?? files[0]
  const [isDragOver, setIsDragOver] = useState(false)
  const [isExtractingZip, setIsExtractingZip] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState<{
    current: number
    total: number
  } | null>(null)

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
    const newId = Math.max(0, ...files.map((f) => f.id)) + 1
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

  const addDroppedFiles = async (droppedFiles: FileList) => {
    const newFiles: FileData[] = []
    const updatedFiles = files.map((f) => ({ ...f, selected: false }))
    let hasReplacedFiles = false // Track if any existing files were replaced

    // Separate zip files from regular files
    const zipFiles: File[] = []
    const regularFiles: File[] = []

    for (let i = 0; i < droppedFiles.length; i++) {
      const file = droppedFiles[i]
      if (isZipFile(file.name)) {
        zipFiles.push(file)
      } else {
        regularFiles.push(file)
      }
    }

    // Process regular files first
    for (let i = 0; i < regularFiles.length; i++) {
      const file = regularFiles[i]
      const newId = Math.max(0, ...files.map((f) => f.id), ...newFiles.map((f) => f.id)) + 1

      try {
        let content: string
        if (isBinaryFile(file.name)) {
          // For binary files, read as ArrayBuffer and convert to base64 or keep as binary data
          const arrayBuffer = await file.arrayBuffer()
          const bytes = new Uint8Array(arrayBuffer)
          content = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
        } else {
          content = await file.text()
        }

        newFiles.push({
          id: newId,
          name: file.name,
          content,
          selected: false, // Will select last file at the end
        })
      } catch (error) {
        console.error(`Failed to read file ${file.name}:`, error)
        toast.error(`Failed to read file: ${file.name}`)
      }
    }

    // Process zip files
    for (const zipFile of zipFiles) {
      try {
        setIsExtractingZip(true)
        setExtractionProgress({ current: 0, total: 0 })

        const extractedFiles = await extractZipFile(zipFile, (current, total) => {
          setExtractionProgress({ current, total })
        })

        let extractedCount = 0
        let replacedCount = 0

        for (const extractedFile of extractedFiles) {
          // Check if file with same name already exists
          const existingFileIndex = updatedFiles.findIndex((f) => f.name === extractedFile.name)
          const newFileIndex = newFiles.findIndex((f) => f.name === extractedFile.name)

          if (existingFileIndex !== -1) {
            // Replace existing file in the original files array
            updatedFiles[existingFileIndex] = {
              ...updatedFiles[existingFileIndex],
              content: extractedFile.content,
              selected: false,
            }
            replacedCount++
            hasReplacedFiles = true
          } else if (newFileIndex !== -1) {
            // Replace file in the newFiles array (from earlier in this operation)
            newFiles[newFileIndex] = {
              ...newFiles[newFileIndex],
              content: extractedFile.content,
              selected: false,
            }
            replacedCount++
          } else {
            // Add as new file
            const newId =
              Math.max(
                0,
                ...files.map((f) => f.id),
                ...updatedFiles.map((f) => f.id),
                ...newFiles.map((f) => f.id)
              ) + 1
            newFiles.push({
              id: newId,
              name: extractedFile.name,
              content: extractedFile.content,
              selected: false,
            })
            extractedCount++
          }
        }

        setIsExtractingZip(false)
        setExtractionProgress(null)

        // Show success message
        const messages: string[] = []
        if (extractedCount > 0) {
          messages.push(`Added ${extractedCount} new file${extractedCount > 1 ? 's' : ''}`)
        }
        if (replacedCount > 0) {
          messages.push(`Replaced ${replacedCount} existing file${replacedCount > 1 ? 's' : ''}`)
        }

        toast.success(
          <div className="flex flex-col gap-y-1">
            <p className="text-foreground">Successfully extracted {zipFile.name}</p>
            <p className="text-foreground-light">{messages.join(' • ')}</p>
          </div>,
          { duration: 5000 }
        )
      } catch (error) {
        console.error(`Failed to extract zip file ${zipFile.name}:`, error)
        setIsExtractingZip(false)
        setExtractionProgress(null)

        toast.error(
          <div className="flex flex-col gap-y-1">
            <p className="text-foreground">Failed to extract {zipFile.name}</p>
            <p className="text-foreground-light">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
          </div>,
          { duration: 8000 }
        )
      }
    }

    // Select the last added/modified file
    if (newFiles.length > 0) {
      newFiles[newFiles.length - 1].selected = true
      onFilesChange([...updatedFiles, ...newFiles])
    } else if (hasReplacedFiles) {
      // If we only replaced files, select the first one
      updatedFiles[0].selected = true
      onFilesChange(updatedFiles)
    }
  }

  const handleStartRename = (id: number) => {
    // Force re-render of the TreeView with the updated metadata
    setTreeData({
      name: '',
      children: files.map((file) => ({
        id: file.id.toString(),
        name: file.name,
        metadata: {
          isEditing: file.id === id,
          originalId: file.id,
        },
      })),
    })
  }

  const exitEditMode = () => {
    // Force re-render of the TreeView with the updated metadata
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
  }

  const handleFileNameChange = (id: number, newName: string) => {
    // Don't allow empty names
    if (!newName.trim()) {
      toast.error('File name cannot be empty')
      return exitEditMode()
    }

    // Check if the new name already exists in other files
    const isDuplicate = files.some((file) => file.id !== id && file.name === newName)
    if (isDuplicate) {
      toast.error(
        `The name ${newName} already exists in the current directory. Please use a different name.`
      )
      return exitEditMode()
    }

    const updatedFiles = files.map((file) =>
      file.id === id
        ? {
            ...file,
            name: newName,
            content:
              newName === 'deno.json' && file.content === ''
                ? denoJsonDefaultContent
                : file.content,
          }
        : file
    )
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      await addDroppedFiles(droppedFiles)
    }
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
    <div
      className={`flex-1 overflow-hidden flex h-full relative ${isDragOver ? 'bg-blue-50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {(isDragOver || isExtractingZip) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute inset-0 bg bg-opacity-30 z-10 flex items-center justify-center"
          >
            <div className="w-96 py-20 bg bg-opacity-60 border-2 border-dashed border-muted flex items-center justify-center">
              {isExtractingZip && extractionProgress ? (
                <div className="text-center space-y-2">
                  <div className="text-base">Extracting zip file...</div>
                  <div className="text-sm text-foreground-light">
                    Processing file {extractionProgress.current} of {extractionProgress.total}
                  </div>
                </div>
              ) : (
                <div className="text-base">Drop files here to add them</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
                        icon={<File size={14} className="text-foreground-light shrink-0" />}
                        isEditing={Boolean(element.metadata?.isEditing)}
                        onEditSubmit={(value) => {
                          if (originalId !== null) {
                            handleFileNameChange(originalId, value)
                          }
                        }}
                        onClick={() => {
                          if (originalId !== null && !element.metadata?.isEditing) {
                            handleFileSelect(originalId)
                          }
                        }}
                        onDoubleClick={() => {
                          if (originalId !== null) {
                            handleStartRename(originalId)
                          }
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
                            if (originalId !== null) {
                              handleFileDelete(originalId)
                            }
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
        {selectedFile && isBinaryFile(selectedFile.name) ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-foreground-light text-lg mb-2">Cannot Edit Selected File</div>
              <div className="text-foreground-lighter text-sm">
                Binary files like .{selectedFile.name.split('.').pop()} cannot be edited in the text
                editor
              </div>
            </div>
          </div>
        ) : (
          <AIEditor
            language={getLanguageFromFileName(selectedFile?.name || 'index.ts')}
            value={selectedFile?.content}
            onChange={handleChange}
            aiEndpoint={aiEndpoint}
            aiMetadata={aiMetadata}
            options={{
              tabSize: 2,
              fontSize: 13,
              minimap: { enabled: false },
              wordWrap: 'on',
              lineNumbers: 'on',
              folding: false,
              padding: { top: 20, bottom: 20 },
              lineNumbersMinChars: 3,
              fixedOverflowWidgets: true,
            }}
          />
        )}
      </div>
    </div>
  )
}
