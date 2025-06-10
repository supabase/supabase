import { ChevronDown, Clock, Search, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { traceDataSets } from '../data/trace-data'

interface TimelineHeaderProps {
  onZoomIn: () => void
  onZoomOut: () => void
  showTimestamps: boolean
  onToggleTimestamps: () => void
  selectedDataSetId: string
  onSelectDataSet: (id: string) => void
}

export function TimelineHeader({
  onZoomIn,
  onZoomOut,
  showTimestamps,
  onToggleTimestamps,
  selectedDataSetId,
  onSelectDataSet,
}: TimelineHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Get the currently selected data set label
  const selectedDataSet = traceDataSets.find((ds) => ds.id === selectedDataSetId)
  const selectedLabel = selectedDataSet?.label || 'Select trace data'

  return (
    <div className="border-b border-neutral-800 p-3 flex items-center justify-between sticky top-0 z-10 bg-black">
      <div className="flex items-center gap-4">
        {/* Data set selector dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800 text-sm hover:bg-neutral-800 transition-colors"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span>{selectedLabel}</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-neutral-900 border border-neutral-800 rounded-md shadow-lg z-[9999]">
              {traceDataSets.map((dataSet) => (
                <button
                  key={dataSet.id}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-800 transition-colors ${
                    dataSet.id === selectedDataSetId ? 'bg-neutral-800' : ''
                  }`}
                  onClick={() => {
                    onSelectDataSet(dataSet.id)
                    setDropdownOpen(false)
                  }}
                >
                  {dataSet.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search input */}
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search spans..."
            className="pl-8 pr-4 py-2 w-full border border-neutral-800 rounded-md text-sm bg-neutral-900 text-white"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleTimestamps}
          className={`p-1 rounded-md ${showTimestamps ? 'bg-neutral-700' : 'hover:bg-neutral-900'}`}
          aria-label={showTimestamps ? 'Hide timestamps' : 'Show timestamps'}
          title={showTimestamps ? 'Hide timestamps' : 'Show timestamps'}
        >
          <Clock className="h-5 w-5" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-1 rounded-md hover:bg-neutral-900"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <button
          onClick={onZoomIn}
          className="p-1 rounded-md hover:bg-neutral-900"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
