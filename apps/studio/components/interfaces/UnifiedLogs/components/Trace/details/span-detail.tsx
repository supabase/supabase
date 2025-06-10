'use client'
import { X } from 'lucide-react'
import { cn } from 'ui'
import type { LayoutSpan } from '../utils/layout-algorithm'

interface SpanDetailProps {
  span: LayoutSpan
  onClose: () => void
}

export function SpanDetail({ span, onClose }: SpanDetailProps) {
  return (
    <div className="w-full md:w-96 border-t border-neutral-800 md:border-t-0 md:border-l-neutral-800 md:border-l overflow-y-auto">
      <div className="flex justify-between items-center p-3 border-b border-neutral-800 sticky top-0 bg-black">
        <h3 className="font-medium">Span Details</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-neutral-800"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 truncate">{span.name}</h3>
        <div className="text-sm text-neutral-400">
          <div className="flex justify-between">
            <span>Start Time</span>
            <span>{span.startTime.toFixed(2)}ms</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>End Time</span>
            <span>{span.endTime.toFixed(2)}ms</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Duration</span>
            <span className="text-white">{(span.endTime - span.startTime).toFixed(2)}ms</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Depth</span>
            <span>{span.depth}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Row</span>
            <span>{span.row}</span>
          </div>
          {span.status && (
            <div className="flex justify-between mt-3">
              <span>Status</span>
              <span
                className={cn(
                  span.status === 'error'
                    ? 'text-red-500'
                    : span.status === 'warning'
                      ? 'text-yellow-500'
                      : span.status === 'success'
                        ? 'text-green-500'
                        : 'text-blue-500'
                )}
              >
                {span.status.toUpperCase()}
              </span>
            </div>
          )}

          {span.children.length > 0 && (
            <div className="mt-3">
              <span className="block mb-1">Child Spans:</span>
              <ul className="list-disc pl-5">
                {span.children.map((child) => (
                  <li key={child.id} className="text-xs">
                    {child.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {span.parent && (
            <div className="mt-3">
              <span className="block mb-1">Parent Span:</span>
              <div className="text-xs pl-5">{span.parent.name}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
