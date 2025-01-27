import { useCallback } from 'react'
import { toast } from 'sonner'

import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { copyToClipboard } from 'lib/helpers'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { URL_EXPIRY_DURATION } from '../Storage.constants'
import { fetchFileUrl } from './useFetchFileUrlQuery'

export const useCopyUrl = () => {
  const { projectRef, selectedBucket, getPathAlongOpenedFolders } = useStorageStore()
  const { data: customDomainData } = useCustomDomainsQuery({ projectRef: projectRef })
  const { data: settings } = useProjectSettingsV2Query({ projectRef: projectRef })

  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint
  const apiUrl = `${protocol}://${endpoint ?? '-'}`

  const getFileUrl = useCallback(
    (fileName: string, expiresIn?: URL_EXPIRY_DURATION) => {
      const pathToFile = getPathAlongOpenedFolders(false)
      const formattedPathToFile = [pathToFile, fileName].join('/')

      return fetchFileUrl(
        formattedPathToFile,
        projectRef,
        selectedBucket.id,
        selectedBucket.public,
        expiresIn
      )
    },
    [projectRef, selectedBucket.id, selectedBucket.public, getPathAlongOpenedFolders]
  )

  const onCopyUrl = useCallback(
    (name: string, expiresIn?: URL_EXPIRY_DURATION) => {
      const formattedUrl = getFileUrl(name, expiresIn).then((url) => {
        return customDomainData?.customDomain?.status === 'active'
          ? url.replace(apiUrl, `https://${customDomainData.customDomain.hostname}`)
          : url
      })

      return copyToClipboard(formattedUrl, () => {
        toast.success(`Copied URL for ${name} to clipboard.`)
      })
    },
    [
      apiUrl,
      customDomainData?.customDomain?.hostname,
      customDomainData?.customDomain?.status,
      getFileUrl,
    ]
  )

  return { onCopyUrl }
}
