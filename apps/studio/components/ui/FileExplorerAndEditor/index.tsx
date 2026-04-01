import { IS_PLATFORM } from 'common'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button, cn, flattenTree, INodeRendererProps, TreeView } from 'ui'

import { FileAction, TreeChildData, type FileData } from './FileExplorerAndEditor.types'
import {
  extractZipFile,
  getFileAction,
  getLanguageFromFileName,
  isBinaryFile,
  isZipFile,
} from './FileExplorerAndEditor.utils'
import { FileExplorerAndEditorRow } from './FileExplorerAndEditorRow'
import { AIEditor } from '@/components/ui/AIEditor'

interface FileExplorerAndEditorProps {
  files: FileData[]
  onFilesChange: (files: FileData[]) => void
  aiEndpoint?: string
  aiMetadata?: {
    projectRef?: string
    connectionString?: string | null
    orgSlug?: string
  }

  selectedFileId?: number
  setSelectedFileId?: (id: number) => void
}

const denoJsonDefaultContent = JSON.stringify({ imports: {} }, null, '\t')

export const FileExplorerAndEditor = ({
  files,
  onFilesChange,
  aiEndpoint,
  aiMetadata,
  selectedFileId: extSelectedFileId,
  setSelectedFileId: extSetSelectedFileId,
}: FileExplorerAndEditorProps) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [_selectedFileId, _setSelectedFileId] = useState<number>(files[0]?.id)
  const [extractionProgress, setExtractionProgress] = useState<{
    current: number
    total: number
  } | null>(null)

  const selectedFileId = extSelectedFileId ?? _selectedFileId
  const setSelectedFileId = extSetSelectedFileId ?? _setSelectedFileId

  const selectedFile = files.find((f) => f.id === selectedFileId)
  const isExtractingZip = extractionProgress !== null

  const [treeData, setTreeData] = useState<{ name: string; children: TreeChildData[] }>({
    name: '',
    children: files.map((file) => ({
      id: file.id.toString(),
      name: file.name,
      metadata: {
        isEditing: false,
        originalId: file.id,
        state: file.state,
      },
    })),
  })

  const handleChange = (value: string) => {
    const updatedFiles = files.map((file) =>
      file.id === selectedFileId ? { ...file, content: value } : file
    )

    onFilesChange(updatedFiles)
  }

  const addNewFile = () => {
    const newId = Math.max(0, ...files.map((f) => f.id)) + 1
    const updatedFiles = files.map((f) => ({ ...f, selected: false }))

    setSelectedFileId(newId)
    onFilesChange([
      ...updatedFiles,
      { id: newId, name: `file${newId}.ts`, content: '', state: 'new' },
    ])
  }

  const addDroppedFiles = async (droppedFiles: FileList) => {
    const newFiles: FileData[] = []
    const updatedFiles = files.map((f) => ({ ...f, selected: false }))
    const allFiles: { name: string; content: string; size: number }[] = []

    let extractedCount = 0
    let replacedCount = 0
    let hasReplacedFiles = false // Track if any existing files were replaced

    for (const file of droppedFiles) {
      if (isZipFile(file.name)) {
        try {
          setExtractionProgress({ current: 0, total: 0 })
          const extractedFiles = await extractZipFile(file, (current, total) => {
            setExtractionProgress({ current, total })
          })
          allFiles.push(...extractedFiles)
        } catch (error) {
          toast.error(
            <div className="flex flex-col gap-y-1">
              <p className="text-foreground">Failed to extract {file.name}</p>
              <p className="text-foreground-light">
                {error instanceof Error ? error.message : 'Unknown error occurred'}
              </p>
            </div>,
            { duration: 8000 }
          )
        } finally {
          setExtractionProgress(null)
        }
      } else {
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
          allFiles.push({ name: file.name, size: file.size, content })
        } catch (error) {
          toast.error(`Failed to read file: ${file.name}: ${error}`)
        }
      }
    }

    for (const file of allFiles) {
      const actionResult = getFileAction(file.name, updatedFiles, newFiles)

      switch (actionResult.action) {
        case FileAction.REPLACE_EXISTING:
          updatedFiles[actionResult.index] = {
            ...updatedFiles[actionResult.index],
            content: file.content,
          }
          replacedCount++
          hasReplacedFiles = true
          break

        case FileAction.REPLACE_NEW:
          newFiles[actionResult.index] = {
            ...newFiles[actionResult.index],
            content: file.content,
          }
          replacedCount++
          break

        case FileAction.CREATE_NEW:
          const newId =
            Math.max(
              0,
              ...files.map((f) => f.id),
              ...updatedFiles.map((f) => f.id),
              ...newFiles.map((f) => f.id)
            ) + 1
          newFiles.push({
            id: newId,
            name: file.name,
            content: file.content,
            state: 'new',
          })
          extractedCount++
          break
      }
    }

    // Show success message
    const messages: string[] = []
    if (extractedCount > 0) {
      messages.push(`Added ${extractedCount} new file${extractedCount > 1 ? 's' : ''}`)
    }
    if (replacedCount > 0) {
      messages.push(`Replaced ${replacedCount} existing file${replacedCount > 1 ? 's' : ''}`)
    }
    const totalFilesProcessed = extractedCount + replacedCount

    if (totalFilesProcessed > 0) {
      toast.success(
        <div className="flex flex-col gap-y-1">
          <p className="text-foreground">
            Successfully added dropped file{totalFilesProcessed > 1 ? 's' : ''}
          </p>
          <p className="text-foreground-light">{messages.join(', ')}.</p>
        </div>,
        { duration: 5000 }
      )
    }

    // Select the last added/modified file
    if (newFiles.length > 0) {
      setSelectedFileId(newFiles[newFiles.length - 1].id)
      onFilesChange([...updatedFiles, ...newFiles])
    } else if (hasReplacedFiles) {
      // If we only replaced files, select the first one
      setSelectedFileId(updatedFiles[0].id)
      onFilesChange(updatedFiles)
    }
  }

  const handleStartRename = useCallback(
    (id: number) => {
      // Force re-render of the TreeView with the updated metadata
      setTreeData({
        name: '',
        children: files.map((file) => ({
          id: file.id.toString(),
          name: file.name,
          metadata: {
            isEditing: file.id === id,
            originalId: file.id,
            state: file.state,
          },
        })),
      })
    },
    [files]
  )

  const exitEditMode = useCallback(() => {
    // Force re-render of the TreeView with the updated metadata
    setTreeData({
      name: '',
      children: files.map((file) => ({
        id: file.id.toString(),
        name: file.name,
        metadata: {
          isEditing: false,
          originalId: file.id,
          state: file.state,
        },
      })),
    })
  }, [files])

  const handleFileNameChange = useCallback(
    (id: number, newName: string) => {
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

      const updatedFiles = files.map((file) => {
        return file.id === id
          ? {
              ...file,
              name: newName,
              content:
                newName === 'deno.json' && file.content === ''
                  ? denoJsonDefaultContent
                  : file.content,
            }
          : file
      })
      onFilesChange(updatedFiles)
    },
    [files, onFilesChange, exitEditMode]
  )

  const handleFileDelete = useCallback(
    (id: number) => {
      if (files.length <= 1) {
        // Don't allow deleting the last file
        return
      }

      const fileToDelete = files.find((f) => f.id === id)
      const isSelected = fileToDelete?.id === selectedFileId
      const updatedFiles = files.filter((file) => file.id !== id)

      // If the deleted file was selected, select another file
      if (isSelected && updatedFiles.length > 0) {
        setSelectedFileId(updatedFiles[0].id)
      }

      onFilesChange(updatedFiles)
    },
    [files, selectedFileId, setSelectedFileId, onFilesChange]
  )

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
          state: file.state,
        },
      })),
    })

    if (!selectedFileId && files.length > 0) setSelectedFileId(files[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files])

  const renderNode = useCallback(
    (props: INodeRendererProps) => (
      <FileExplorerAndEditorRow
        {...props}
        files={files}
        selectedFileId={selectedFileId}
        setSelectedFileId={setSelectedFileId}
        handleFileNameChange={handleFileNameChange}
        handleStartRename={handleStartRename}
        handleFileDelete={handleFileDelete}
      />
    ),
    [
      files,
      selectedFileId,
      setSelectedFileId,
      handleFileNameChange,
      handleStartRename,
      handleFileDelete,
    ]
  )

  return (
    <div
      className={cn(
        'flex-1 overflow-hidden flex h-full relative gap-x-3 bg-surface-100',
        isDragOver && 'bg-blue-50'
      )}
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

      <div className="min-w-64 w-64 border-r bg-surface-200 flex flex-col">
        <div className="py-4 px-6 border-b flex items-center justify-between">
          <h3 className="text-sm font-normal font-mono uppercase text-lighter tracking-wide">
            Files
          </h3>
          {IS_PLATFORM && (
            <Button size="tiny" type="default" icon={<Plus size={14} />} onClick={addNewFile}>
              Add File
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          <TreeView
            data={flattenTree(treeData)}
            aria-label="files tree"
            nodeRenderer={renderNode}
          />
        </div>
      </div>

      <div className="flex-grow min-w-0">
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
              readOnly: !IS_PLATFORM,
            }}
          />
        )}
      </div>
    </div>
  )
}
