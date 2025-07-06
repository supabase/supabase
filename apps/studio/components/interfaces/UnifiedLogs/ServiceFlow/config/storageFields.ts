import { formatBytes } from 'lib/helpers'
import { BlockFieldConfig } from '../types'
import { getStorageMetadata } from '../ServiceFlowBlocks'

// Helper functions that avoid duplication with existing storage utilities
const getFileName = (path: string): string => {
  if (!path) return ''
  // Remove query parameters and hash
  const cleanPath = path.split('?')[0].split('#')[0]
  // Get the last part after the last slash
  const segments = cleanPath.split('/')
  return segments[segments.length - 1] || ''
}

const formatStorageDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleString()
  } catch {
    return dateString
  }
}

// Primary Storage Fields (Always Visible)
export const storagePrimaryFields: BlockFieldConfig[] = [
  {
    id: 'status',
    label: 'Status',
    getValue: (data, enrichedData) => enrichedData?.status || data?.status,
  },
  {
    id: 'filename',
    label: 'File Name',
    getValue: (data, enrichedData) => {
      const path = enrichedData?.path || enrichedData?.request_path || data?.path
      return path ? getFileName(path) : null
    },
    requiresEnrichedData: false,
  },
  {
    id: 'content_type_size',
    label: 'Type & Size',
    getValue: (data, enrichedData) => {
      const status = enrichedData?.status || data?.status
      const isObjectDeleted = status === 404 || status === '404'
      const hasError = status && Number(status) >= 400

      // For deleted objects, show status message
      if (isObjectDeleted) {
        return 'Object deleted'
      } else if (hasError) {
        return `Error ${status}`
      }

      // Try to get metadata like PreviewPane does
      const metadata = getStorageMetadata(data, enrichedData)
      const mimeType = metadata?.mimetype
      const size = metadata?.size

      // Fallback to headers if metadata not available
      const contentType =
        mimeType ||
        enrichedData?.response_content_type ||
        enrichedData?.storage_request_content_type
      const contentLength =
        size ||
        (enrichedData?.storage_content_length
          ? parseInt(enrichedData.storage_content_length)
          : null)

      if (contentType && contentLength) {
        return `${contentType} - ${formatBytes(contentLength)}`
      } else if (contentType) {
        return contentType
      } else if (contentLength) {
        return formatBytes(contentLength)
      }
      return 'Unknown type'
    },
    requiresEnrichedData: true,
  },
  {
    id: 'response_time',
    label: 'Response Time',
    getValue: (data, enrichedData) => {
      const time = enrichedData?.response_origin_time || data?.response_time_ms
      return time ? `${time}ms` : null
    },
    requiresEnrichedData: true,
  },
]

// Storage Details (Collapsible)
export const storageDetailsFields: BlockFieldConfig[] = [
  {
    id: 'storage_path',
    label: 'Storage Path',
    getValue: (data, enrichedData) => {
      const path = enrichedData?.path || enrichedData?.request_path || data?.path
      // Extract just the object path from the full storage path
      const match = path?.match(/\/storage\/v1\/object\/([^\/]+)\/(.+)/)
      if (match) {
        const [, bucketName, objectPath] = match
        return `${bucketName}/${objectPath}`
      }
      return path
    },
    requiresEnrichedData: false,
  },
  {
    id: 'last_modified',
    label: 'Last Modified',
    getValue: (data, enrichedData) => {
      const status = enrichedData?.status || data?.status
      const isObjectDeleted = status === 404 || status === '404'
      const hasError = status && Number(status) >= 400

      if (isObjectDeleted) {
        return 'Object deleted'
      } else if (hasError) {
        return 'Unavailable'
      }

      // Try to get dates from metadata like PreviewPane does
      const metadata = getStorageMetadata(data, enrichedData)
      const updatedAt = metadata?.updated_at || data?.updated_at || enrichedData?.updated_at
      const lastModified = enrichedData?.storage_last_modified || updatedAt

      return lastModified ? formatStorageDate(lastModified) : null
    },
    requiresEnrichedData: true,
  },
  {
    id: 'etag',
    label: 'ETag',
    getValue: (data, enrichedData) => {
      const status = enrichedData?.status || data?.status
      const isObjectDeleted = status === 404 || status === '404'
      const hasError = status && Number(status) >= 400

      if (isObjectDeleted) {
        return 'Object deleted'
      } else if (hasError) {
        return 'Unavailable'
      }

      const etag = enrichedData?.storage_etag
      return etag ? `${etag.substring(0, 12)}...` : null
    },
    requiresEnrichedData: true,
  },
  {
    id: 'content_disposition',
    label: 'Content Disposition',
    getValue: (data, enrichedData) => {
      const status = enrichedData?.status || data?.status
      const isObjectDeleted = status === 404 || status === '404'
      const hasError = status && Number(status) >= 400

      if (isObjectDeleted) {
        return 'Object deleted'
      } else if (hasError) {
        return 'Unavailable'
      }

      return enrichedData?.storage_content_disposition || null
    },
    requiresEnrichedData: true,
  },
  {
    id: 'method',
    label: 'Method',
    getValue: (data, enrichedData) => enrichedData?.method || data?.method,
    requiresEnrichedData: false,
  },
  {
    id: 'user_agent',
    label: 'User Agent',
    getValue: (data, enrichedData) => {
      const ua = enrichedData?.headers_user_agent || data?.headers_user_agent
      return ua ? (ua.length > 30 ? `${ua.substring(0, 30)}...` : ua) : null
    },
    requiresEnrichedData: false,
  },
]
