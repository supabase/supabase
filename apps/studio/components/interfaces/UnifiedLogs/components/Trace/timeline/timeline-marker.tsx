import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react'

import { MouseEvent } from 'react'
import { cn } from 'ui'
import type { Marker } from '../types/trace'

interface TimelineMarkerProps {
  marker: Marker
  duration: number
  isSelected: boolean
  onClick: (e: MouseEvent, marker: Marker) => void
}

export function TimelineMarker({ marker, duration, isSelected, onClick }: TimelineMarkerProps) {
  const positionPercent = (marker.time / duration) * 100

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
    <div
      className={cn(
        'absolute top-0 z-40 flex flex-col items-center cursor-pointer',
        isSelected ? 'opacity-100' : 'opacity-80 hover:opacity-100'
      )}
      style={{
        left: `${positionPercent}%`,
        height: '100%',
      }}
      onClick={(e) => onClick(e, marker)}
    >
      <div
        className="h-6 border-l border-dashed border-neutral-600"
        style={{ height: '100%' }}
      ></div>
      <div
        className={cn(
          'absolute -top-[0px] left-0 transform -translate-x-1/2 flex items-center justify-center rounded-full p-1 border',
          isSelected ? 'bg-neutral-800' : 'bg-surface-400'
        )}
      >
        {getMarkerIcon(marker.type)}
      </div>
    </div>
  )
}
