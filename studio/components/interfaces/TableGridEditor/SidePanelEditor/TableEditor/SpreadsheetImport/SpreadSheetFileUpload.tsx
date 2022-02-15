import { DragEvent, useRef, useState, FC } from 'react'
import { Button, Typography, IconLoader, IconFileText } from '@supabase/ui'
import SparkBar from 'components/ui/SparkBar'

interface Props {
  parseProgress: number
  uploadedFile: any
  onFileUpload: (event: any) => void
  removeUploadedFile: () => void
}

const SpreadSheetFileUpload: FC<Props> = ({
  parseProgress,
  uploadedFile,
  onFileUpload,
  removeUploadedFile,
}) => {
  const [isDraggedOver, setIsDraggedOver] = useState(false)
  const uploadButtonRef = useRef(null)

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (event.type === 'dragover' && !isDraggedOver) {
      setIsDraggedOver(true)
    } else if (event.type === 'dragleave' || event.type === 'drop') {
      setIsDraggedOver(false)
    }
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    onDragOver(event)
    onFileUpload(event)
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-scale-1100 mb-2">
          Upload a CSV or TSV file. The first row should be the headers of the table, and your
          headers should not include any special characters other than hyphens (
          <span className="text-code">-</span>) or underscores (<span className="text-code">_</span>
          ).
        </p>
        <p className="text-xs text-scale-900">
          Tip: Datetime columns should be formatted as YYYY-MM-DD HH:mm:ss
        </p>
      </div>
      {!uploadedFile ? (
        <div
          className={`flex items-center justify-center border dark:border-gray-500 border-dashed rounded-md h-48 ${
            isDraggedOver ? 'bg-gray-500' : ''
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragOver}
          onDrop={onDrop}
          onClick={() => (uploadButtonRef.current as any)?.click()}
        >
          <Typography.Text>
            Drag and drop, or <span className="text-green-500 cursor-pointer">browse</span> your
            files
          </Typography.Text>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border dark:border-gray-500 border-dashed rounded-md h-32 space-y-2">
          <div className="flex items-center space-x-2">
            <IconFileText size={14} strokeWidth={1.5} />
            <h3 className="text-scale-1200 text-base">{uploadedFile.name}</h3>
          </div>
          {parseProgress === 100 ? (
            <Button type="outline" onClick={removeUploadedFile}>
              Remove File
            </Button>
          ) : (
            <div className="flex items-center w-3/5 space-x-2">
              <IconLoader className="animate-spin w-4 h-4" />
              <SparkBar
                value={parseProgress}
                max={100}
                type={'horizontal'}
                barClass={'bg-green-500'}
                labelBottom="Parsing file..."
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
