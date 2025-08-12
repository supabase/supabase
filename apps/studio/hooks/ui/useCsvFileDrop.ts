import { ImportDataFileDroppedEvent, type TelemetryEvent } from 'common/telemetry-constants'
import { type DragEvent, useCallback, useState } from 'react'

import {
  dispatchProcessDroppedFileEvent,
  flagInvalidFileImport,
} from 'components/interfaces/TableGridEditor/SidePanelEditor/SpreadsheetImport/SpreadsheetImport.utils'

interface UseCsvFileDropOptions {
  enabled: boolean
  onFileDropped: () => void
  onTelemetryEvent?: (
    eventName: ImportDataFileDroppedEvent['action'],
    properties: ImportDataFileDroppedEvent['properties']
  ) => void
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
      if (flagInvalidFileImport(file)) return

      // Notify parent that a file was dropped
      onFileDropped()

      // Process the file in the next tick to avoid state issues from React
      // clearing synthetic event
      setTimeout(() => {
        dispatchProcessDroppedFileEvent(file)
      })

      onTelemetryEvent?.('import_data_file_dropped', {
        tableType: 'Existing Table',
      })
    },
    [enabled, onDragOver, onFileDropped, onTelemetryEvent]
  )

  return {
    isDraggedOver,
    onDragOver,
    onFileDrop,
  }
}
