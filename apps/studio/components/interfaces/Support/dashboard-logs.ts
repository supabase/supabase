import * as Sentry from '@sentry/nextjs'

import { SupportCategories } from '@supabase/shared-types/out/constants'
import type {
  GenerateAttachmentURLsData,
  GenerateAttachmentURLsVariables,
} from 'data/support/generate-attachment-urls-mutation'
import { getMirroredBreadcrumbs, getOwnershipOfBreadcrumbSnapshot } from 'lib/breadcrumbs'
import { uuidv4 } from 'lib/helpers'
import { sanitizeArrayOfObjects } from 'lib/sanitize'
import { createSupportStorageClient } from './support-storage-client'
import type { ExtendedSupportCategories } from './Support.constants'

export type DashboardBreadcrumb = Sentry.Breadcrumb

export const DASHBOARD_LOG_BUCKET = 'dashboard-logs'

export const DASHBOARD_LOG_CATEGORIES: ExtendedSupportCategories[] = [
  SupportCategories.DASHBOARD_BUG,
]

export const getSanitizedBreadcrumbs = (): unknown[] => {
  const breadcrumbs = getOwnershipOfBreadcrumbSnapshot() ?? getMirroredBreadcrumbs()
  return sanitizeArrayOfObjects(breadcrumbs)
}

export const uploadDashboardLog = async ({
  userId,
  sanitizedLogs,
  uploadDashboardLogFn,
}: {
  userId: string | undefined
  sanitizedLogs: unknown[]
  uploadDashboardLogFn: (
    vars: GenerateAttachmentURLsVariables
  ) => Promise<GenerateAttachmentURLsData>
}): Promise<string[]> => {
  if (!userId) {
    console.error(
      '[SupportForm > uploadDashboardLog] Cannot upload dashboard log: user ID is undefined'
    )
    return []
  }

  if (sanitizedLogs.length === 0) return []

  try {
    const supportStorageClient = createSupportStorageClient()
    const objectKey = `${userId}/${uuidv4()}.json`
    const body = new Blob([JSON.stringify(sanitizedLogs, null, 2)], {
      type: 'application/json',
    })

    const { error: uploadError } = await supportStorageClient.storage
      .from(DASHBOARD_LOG_BUCKET)
      .upload(objectKey, body, {
        cacheControl: '3600',
        contentType: 'application/json',
        upsert: false,
      })

    if (uploadError) {
      console.error(
        '[SupportForm > uploadDashboardLog] Failed to upload dashboard log to support storage bucket',
        uploadError
      )
      return []
    }

    return uploadDashboardLogFn({
      bucket: DASHBOARD_LOG_BUCKET,
      filenames: [objectKey],
    })
  } catch (error) {
    console.error('[SupportForm] Unexpected error uploading dashboard log', error)
    return []
  }
}
