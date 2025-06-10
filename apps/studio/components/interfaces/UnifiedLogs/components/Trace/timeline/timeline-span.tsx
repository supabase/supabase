'use client'

import {
  AlertTriangle,
  ArrowRight,
  Cpu,
  Database,
  FileCode,
  Globe,
  Lock,
  RefreshCw,
  Search,
  Server,
} from 'lucide-react'
import type React from 'react'
import { cn } from 'ui'
import type { Span } from '../types/trace'
import type { LayoutSpan } from '../utils/layout-algorithm'

interface TimelineSpanProps {
  span: LayoutSpan
  duration: number
  isSelected: boolean
  isVisible: boolean
  endBeyondViewport: boolean
  onClick: (e: React.MouseEvent, span: LayoutSpan) => void
  showTimestamps: boolean
  absoluteRow: number
}

export function TimelineSpan({
  span,
  duration,
  isSelected,
  isVisible,
  endBeyondViewport,
  onClick,
  showTimestamps,
  absoluteRow,
}: TimelineSpanProps) {
  const startPercent = (span.startTime / duration) * 100
  const widthPercent = Math.max(0.5, ((span.endTime - span.startTime) / duration) * 100)

  // Get span background color based on status
  const getSpanBackground = (span: Span) => {
    if (span.highlight) return 'bg-[#0c2d6b] border-[#0a3a8c]'
    if (span.status === 'error') return 'bg-[#3b1212] border-[#5c1a1a]'
    if (span.status === 'warning') return 'bg-[#332611] border-[#4d3919]'
    if (span.status === 'success') return 'bg-[#0f2b17] border-[#164023]'
    return 'bg-neutral-900 border-neutral-800'
  }

  // Get icon based on span type or name
  const getSpanIcon = (span: Span) => {
    // If span has a specific icon defined, use that
    if (span.icon) {
      switch (span.icon) {
        case 'database':
          return <Database className="h-3 w-3" />
        case 'server':
          return <Server className="h-3 w-3" />
        case 'globe':
          return <Globe className="h-3 w-3" />
        case 'code':
          return <FileCode className="h-3 w-3" />
        case 'lock':
          return <Lock className="h-3 w-3" />
        case 'search':
          return <Search className="h-3 w-3" />
        case 'cpu':
          return <Cpu className="h-3 w-3" />
        case 'refresh':
          return <RefreshCw className="h-3 w-3" />
        case 'warning':
          return <AlertTriangle className="h-3 w-3" />
      }
    }

    // Otherwise infer from name
    if (span.name.includes('Database') || span.name.includes('SQL')) {
      return <Database className="h-3 w-3" />
    } else if (span.name.includes('API') || span.name.includes('HTTP')) {
      return <Globe className="h-3 w-3" />
    } else if (span.name.includes('Render') || span.name.includes('Component')) {
      return <FileCode className="h-3 w-3" />
    } else if (span.name.includes('Auth') || span.name.includes('JWT')) {
      return <Lock className="h-3 w-3" />
    } else if (span.name.includes('Cache')) {
      return <RefreshCw className="h-3 w-3" />
    } else if (span.name.includes('Vercel')) {
      return <Server className="h-3 w-3" />
    }

    // Default icon
    return <ArrowRight className="h-3 w-3" />
  }

  // Extract HTTP method if present
  const extractMethod = (name: string): { method: string | null; restOfName: string } => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']

    // Check if span has a method property
    if (span.method) {
      // Find where the method appears in the name
      const index = name.indexOf(span.method)
      if (index >= 0) {
        return {
          method: span.method,
          restOfName: name.substring(0, index) + name.substring(index + span.method.length),
        }
      }
    }

    // Otherwise try to extract from name
    for (const method of methods) {
      if (name.includes(method + ' ') || name.startsWith(method + ' ')) {
        const index = name.indexOf(method)
        return {
          method,
          restOfName: name.substring(0, index) + name.substring(index + method.length),
        }
      }
    }

    return { method: null, restOfName: name }
  }

  const { method, restOfName } = extractMethod(span.name)
  const bgClass = getSpanBackground(span)

  // Get method badge color
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-900 text-blue-300'
      case 'POST':
        return 'bg-green-900 text-green-300'
      case 'PUT':
        return 'bg-yellow-900 text-yellow-300'
      case 'DELETE':
        return 'bg-red-900 text-red-300'
      case 'PATCH':
        return 'bg-purple-900 text-purple-300'
      default:
        return 'bg-gray-800 text-gray-300'
    }
  }

  return (
    <div
      className={cn(
        'absolute h-6 flex items-center px-2 text-xs font-medium transition-all border',
        isSelected ? 'bg-neutral-800 border-neutral-700' : bgClass,
        isSelected ? 'z-30' : 'hover:bg-opacity-80',
        'rounded-md'
      )}
      style={{
        left: `${startPercent}%`,
        width: `${widthPercent}%`,
        top: `${absoluteRow * 28 + 10}px`,
      }}
      onClick={(e) => onClick(e, span)}
    >
      {/* Icon */}
      <div className="mr-1.5 text-neutral-400">{getSpanIcon(span)}</div>

      {/* Name with method badge if applicable */}
      <div className="truncate flex items-center gap-1.5">
        {method && (
          <span
            className={cn('px-1 py-0.5 rounded text-[10px] font-semibold', getMethodColor(method))}
          >
            {method}
          </span>
        )}
        <span className="truncate">{restOfName}</span>
      </div>

      {/* Sticky timestamp that follows the span end or sticks to viewport edge */}
      {isVisible && showTimestamps && (
        <div
          className={cn(
            'absolute text-xs text-white whitespace-nowrap px-1 py-0.5 rounded-sm',
            'right-0 top-0 bottom-0 flex items-center'
          )}
          style={{
            position: endBeyondViewport ? 'fixed' : 'absolute',
            right: endBeyondViewport ? '0' : 'auto',
          }}
        >
          {span.endTime.toFixed(2)}ms
        </div>
      )}
    </div>
  )
}
