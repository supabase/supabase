'use client'

import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react'
import { cn } from 'ui'
import type { Marker } from '../types/trace'

interface MarkerDetailProps {
  marker: Marker
  onClose: () => void
}

export function MarkerDetail({ marker, onClose }: MarkerDetailProps) {
  // Get marker icon based on type
  const getMarkerIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-brand" />
      default:
        return <Info className="h-4 w-4 text-blue-900" />
    }
  }

  return (
    <div className="w-full md:w-96 border-t border-neutral-800 md:border-t-0 md:border-l-neutral-800 md:border-l overflow-y-auto">
      <div className="flex justify-between items-center p-3 border-b border-neutral-800 sticky top-0 bg-black">
        <h3 className="font-medium">Marker Details</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-neutral-800"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {getMarkerIcon(marker.type)}
          <h3 className="font-semibold text-lg truncate">{marker.name}</h3>
        </div>
        <div className="text-sm text-neutral-400">
          <div className="flex justify-between">
            <span>Time</span>
            <span>{marker.time.toFixed(2)}ms</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Type</span>
            <span
              className={cn(
                marker.type === 'error'
                  ? 'text-red-500'
                  : marker.type === 'warning'
                    ? 'text-yellow-500'
                    : marker.type === 'success'
                      ? 'text-green-500'
                      : 'text-blue-500'
              )}
            >
              {marker.type.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
