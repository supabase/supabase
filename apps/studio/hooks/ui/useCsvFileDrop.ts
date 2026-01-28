import { type DragEvent, useCallback, useState } from 'react'

import { type ImportDataFileDroppedEvent } from 'common/telemetry-constants'
import { UPLOAD_FILE_TYPES } from 'components/interfaces/TableGridEditor/SidePanelEditor/SpreadsheetImport/SpreadsheetImport.constants'
import { flagInvalidFileImport } from 'components/interfaces/TableGridEditor/SidePanelEditor/SpreadsheetImport/SpreadsheetImport.utils'

interface UseCsvFileDropOptions {
  enabled: boolean
  onFileDropped: (file: File) => void
  onTelemetryEvent?: (eventName: ImportDataFileDroppedEvent['action']) => void
}

interface UseCsvFileDropReturn {
  isDraggedOver: boolean
  isValidFile: boolean
  onDragOver: (event: DragEvent<HTMLDivElement>) => void
  onFileDrop: (event: DragEvent<HTMLDivElement>) => void
}

export function useCsvFileDrop({
  enabled,
  onFileDropped,
  onTelemetryEvent,
}: UseCsvFileDropOptions): UseCsvFileDropReturn {
  const [isDraggedOver, setIsDraggedOver] = useState(false)
  const [isValidFile, setIsValidFile] = useState(false)

  const onDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!enabled) return

      const [item] = event.dataTransfer.items

      // ignore non files drop, like column headers
      if (item && item.kind !== 'file') return

      if (event.type === 'dragover' && !isDraggedOver) {
        setIsDraggedOver(true)
        setIsValidFile(UPLOAD_FILE_TYPES.includes(item.type))
      } else if (event.type === 'dragleave' || event.type === 'drop') {
        setIsDraggedOver(false)
        setIsValidFile(false)
      }
      event.stopPropagation()
      event.preventDefault()
    },
    [enabled, isDraggedOver, isValidFile]
  )

  const onFileDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!enabled) return

      onDragOver(event)

      const [file] = event.dataTransfer.files
      const [item] = event.dataTransfer.items

      // ignore non files drop, like column headers
      if (item && item.kind !== 'file') return

      if (flagInvalidFileImport(file)) return

      onFileDropped(file)

      onTelemetryEvent?.('import_data_dropzone_file_added')
    },
    [enabled, onDragOver, onFileDropped, onTelemetryEvent]
  )

  return {
    isValidFile: isValidFile && isDraggedOver,
    isDraggedOver,
    onDragOver,
    onFileDrop,
  }
}
