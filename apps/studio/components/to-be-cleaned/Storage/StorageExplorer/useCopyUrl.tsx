import { toast } from 'sonner'

import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { copyToClipboard } from 'lib/helpers'

export const useCopyUrl = (ref: string) => {
  const { data: customDomainData } = useCustomDomainsQuery({ projectRef: ref })
  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref })

  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint
  const apiUrl = `${protocol}://${endpoint ?? '-'}`

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
