import { useCallback } from 'react'
import { toast } from 'sonner'
import { copyToClipboard } from 'ui'

import { URL_EXPIRY_DURATION } from '../Storage.constants'
import { fetchFileUrl } from './useFetchFileUrlQuery'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

export const useCopyUrl = () => {
  const { projectRef, selectedBucket } = useStorageExplorerStateSnapshot()

  const { hostEndpoint, customEndpoint } = useProjectApiUrl({ projectRef })
  const isCustomDomainActive = !!customEndpoint

  const getFileUrl = useCallback(
    (filePath: string, expiresIn?: URL_EXPIRY_DURATION) => {
      return fetchFileUrl({
        projectRef,
        clientEndpoint: hostEndpoint!,
        bucketId: selectedBucket.id,
        isBucketPublic: selectedBucket.public,
        path: filePath,
        expiresIn,
      })
    },
    [hostEndpoint, projectRef, selectedBucket]
  )

  const onCopyUrl = useCallback(
    (filePath: string, expiresIn?: URL_EXPIRY_DURATION) => {
      const formattedUrl = getFileUrl(filePath, expiresIn).then((url) => {
        return isCustomDomainActive && hostEndpoint
          ? url.replace(hostEndpoint, customEndpoint)
          : url
      })

      return copyToClipboard(formattedUrl, () => {
        toast.success(`Copied URL for ${filePath} to clipboard.`)
      })
    },
    [customEndpoint, getFileUrl, hostEndpoint, isCustomDomainActive]
  )

  return { onCopyUrl }
}
