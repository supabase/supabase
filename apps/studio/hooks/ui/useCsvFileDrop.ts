import { type ImportDataFileDroppedEvent } from 'common/telemetry-constants'
import { flagInvalidFileImport } from 'components/interfaces/TableGridEditor/SidePanelEditor/SpreadsheetImport/SpreadsheetImport.utils'
import { useCallback, useState, type DragEvent } from 'react'

interface UseCsvFileDropOptions {
  enabled: boolean
  onFileDropped: (file: File) => void
  onTelemetryEvent?: (eventName: ImportDataFileDroppedEvent['action']) => void
}

interface UseCsvFileDropReturn {
  isDraggedOver: boolean
  onDragOver: (event: DragEvent<HTMLDivElement>) => void
  onFileDrop: (event: DragEvent<HTMLDivElement>) => void
}

export function useCsvFileDrop({
  enabled,
  onFileDropped,
  onTelemetryEvent,
}: UseCsvFileDropOptions): UseCsvFileDropReturn {
  const [isDraggedOver, setIsDraggedOver] = useState(false)

  const onDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!enabled) return

      const [item] = event.dataTransfer.items

      // ignore non files drop, like column headers
      if (item && item.kind !== 'file') return

      if (event.type === 'dragover' && !isDraggedOver) {
        setIsDraggedOver(true)
      } else if (event.type === 'dragleave' || event.type === 'drop') {
        setIsDraggedOver(false)
      }
      event.stopPropagation()
      event.preventDefault()
    },
    [enabled, isDraggedOver]
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
    isDraggedOver,
    onDragOver,
    onFileDrop,
  }
}
