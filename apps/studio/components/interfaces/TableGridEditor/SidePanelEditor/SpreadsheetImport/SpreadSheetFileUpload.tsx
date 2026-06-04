import { FileText, Loader } from 'lucide-react'
import { DragEvent, useCallback, useRef, useState, type ChangeEvent } from 'react'
import { Button, cn } from 'ui'

import SparkBar from '@/components/ui/SparkBar'

interface SpreadSheetFileUploadProps {
  parseProgress: number
  uploadedFile: File | undefined
  onFileUpload: (event: DragEvent<HTMLDivElement> | ChangeEvent<HTMLInputElement>) => void
  removeUploadedFile: () => void
}

export const SpreadSheetFileUpload = ({
  uploadedFile,
  onFileUpload,
  parseProgress,
  removeUploadedFile,
}: SpreadSheetFileUploadProps) => {
  const uploadButtonRef = useRef<HTMLInputElement>(null)

  const handleRemoveFile = useCallback(
    function handleRemoveFile() {
      removeUploadedFile()
      if (uploadButtonRef.current) {
        uploadButtonRef.current.value = ''
      }
    },
    [removeUploadedFile]
  )

  return (
    <div className="space-y-4">
      <UploadInstructions />
      {!uploadedFile ? (
        <DropZone onDrop={onFileUpload} onClickUpload={() => uploadButtonRef.current?.click()} />
      ) : (
        <FileDetails
          file={uploadedFile}
          parseProgress={parseProgress}
          removeFile={handleRemoveFile}
        />
      )}
      <input ref={uploadButtonRef} className="hidden" type="file" onChange={onFileUpload} />
    </div>
  )
}

function UploadInstructions() {
  return (
    <div>
      <p className="mb-2 text-sm text-foreground-light">
        Upload a CSV or TSV file. The first row should be the headers of the table, and your headers
        should not include any special characters other than hyphens (
        <span className="text-code">-</span>) or underscores (<span className="text-code">_</span>
        ).
      </p>
      <p className="text-sm text-foreground-light">
        Tip: Datetime columns should be formatted as YYYY-MM-DD HH:mm:ss
      </p>
    </div>
  )
}

interface DropZoneProps {
  onDrop?: (event: DragEvent<HTMLDivElement>) => void
  onClickUpload: () => void
}

function DropZone({ onDrop: onDropFromParent, onClickUpload }: DropZoneProps) {
  const [isDraggedOver, setIsDraggedOver] = useState(false)
  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (event.type === 'dragover' && !isDraggedOver) {
      setIsDraggedOver(true)
    } else if (event.type === 'dragleave' || event.type === 'drop') {
      setIsDraggedOver(false)
    }
    event.stopPropagation()
    event.preventDefault()
  }
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    onDragOver(event)
    onDropFromParent?.(event)
  }

  return (
    <div
      className={cn(
        'flex h-48 items-center justify-center',
        'rounded-md border border-dashed border-strong',
        'cursor-pointer',
        isDraggedOver && 'bg-gray-500'
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragOver}
      onDrop={onDrop}
      onClick={onClickUpload}
    >
      <p className="text-sm">
        Drag and drop, or <span className="text-brand">browse</span> your files
      </p>
    </div>
  )
}

interface FileDetailsProps {
  file: File
  parseProgress: number
  removeFile: () => void
}

function FileDetails({ file, parseProgress, removeFile }: FileDetailsProps) {
  return (
    <div
      className={cn(
        'flex h-28 flex-col items-center justify-center space-y-2',
        'rounded-md border border-dashed border-strong'
      )}
    >
      <div className="flex items-center space-x-2">
        <FileText size={14} strokeWidth={1.5} />
        <p className="text-sm text-foreground">{file.name}</p>
      </div>
      {parseProgress === 100 ? (
        <Button type="outline" onClick={removeFile}>
          Remove File
        </Button>
      ) : (
        <div className="flex w-3/5 items-center space-x-2">
          <Loader className="h-4 w-4 animate-spin" />
          <SparkBar
            value={parseProgress}
            max={100}
            type="horizontal"
            barClass="bg-green-900"
            labelBottom="Checking file..."
            labelTop={`${parseProgress}%`}
          />
        </div>
      )}
    </div>
  )
}
