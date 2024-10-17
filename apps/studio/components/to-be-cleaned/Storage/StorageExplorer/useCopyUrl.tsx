import { toast } from 'sonner'

import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { DEFAULT_PROJECT_API_SERVICE_ID } from 'lib/constants/infrastructure'
import { copyToClipboard } from 'lib/helpers'

export const useCopyUrl = (ref: string) => {
  const { data: customDomainData } = useCustomDomainsQuery({ projectRef: ref })
  const { data: projectSettings } = useProjectSettingsQuery({ projectRef: ref })

  const apiService = (projectSettings?.services ?? []).find(
    (x) => x.app.id == DEFAULT_PROJECT_API_SERVICE_ID
  )
  const apiConfig = apiService?.app_config
  const apiUrl = `${apiConfig?.protocol ?? 'https'}://${apiConfig?.endpoint ?? '-'}`

  const onCopyUrl = (name: string, url: string | Promise<string>) => {
    const formattedUrl = Promise.resolve(url).then((url) => {
      return customDomainData?.customDomain?.status === 'active'
        ? url.replace(apiUrl, `https://${customDomainData.customDomain.hostname}`)
        : url
    })

    return copyToClipboard(formattedUrl, () => {
      toast.success(`Copied URL for ${name} to clipboard.`)
    })
  }

  return { onCopyUrl }
}
