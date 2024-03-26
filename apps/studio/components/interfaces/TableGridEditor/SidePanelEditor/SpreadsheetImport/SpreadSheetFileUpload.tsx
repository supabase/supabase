import { DragEvent, useRef, useState } from 'react'
import { Button, IconFileText, IconLoader } from 'ui'

import SparkBar from 'components/ui/SparkBar'

interface SpreadSheetFileUploadProps {
  parseProgress: number
  uploadedFile: any
  onFileUpload: (event: any) => void
  removeUploadedFile: () => void
}

const SpreadSheetFileUpload = ({
  parseProgress,
  uploadedFile,
  onFileUpload,
  removeUploadedFile,
}: SpreadSheetFileUploadProps) => {
  const [isDraggedOver, setIsDraggedOver] = useState(false)
  const uploadButtonRef = useRef(null)

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
    onFileUpload(event)
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm text-foreground-light">
          Upload a CSV or TSV file. The first row should be the headers of the table, and your
          headers should not include any special characters other than hyphens (
          <span className="text-code">-</span>) or underscores (<span className="text-code">_</span>
          ).
        </p>
        <p className="text-sm text-foreground-light">
          Tip: Datetime columns should be formatted as YYYY-MM-DD HH:mm:ss
        </p>
      </div>
      {!uploadedFile ? (
        <div
          className={`flex h-48 cursor-pointer items-center justify-center rounded-md border border-dashed border-strong ${
            isDraggedOver ? 'bg-gray-500' : ''
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragOver}
          onDrop={onDrop}
          onClick={() => (uploadButtonRef.current as any)?.click()}
        >
          <p className="text-sm">
            Drag and drop, or <span className="text-brand">browse</span> your files
          </p>
        </div>
      ) : (
        <div className="flex h-28 flex-col items-center justify-center space-y-2 rounded-md border border-dashed border-strong">
          <div className="flex items-center space-x-2">
            <IconFileText size={14} strokeWidth={1.5} />
            <p className="text-sm text-foreground">{uploadedFile.name}</p>
          </div>
          {parseProgress === 100 ? (
            <Button type="outline" onClick={removeUploadedFile}>
              Remove File
            </Button>
          ) : (
            <div className="flex w-3/5 items-center space-x-2">
              <IconLoader className="h-4 w-4 animate-spin" />
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
      )}
      <input ref={uploadButtonRef} className="hidden" type="file" onChange={onFileUpload} />
    </div>
  )
}

export default SpreadSheetFileUpload
