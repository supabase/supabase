import { isBrowser } from 'common'
import { useState } from 'react'

export const handleYTConsent = () => {
  if (!isBrowser) return
  const ytAcceptedItem = window.localStorage.getItem('ytAccepted')
  console.log('ytAcceptedItem', ytAcceptedItem)
  let isConceptAccepted
  // 1. Check if iframes in the page
  const iframes = Array.from(document.querySelectorAll('iframe'))
  const hasSandbox = iframes.some((iframe: any) => !!iframe.attributes.sandbox)

  // 2. if ytAccepted=true, remove sandbox attribute from all iframes
  // 3. if ytAccepted=false, place overlay to iframe to accept yt concent
}

export const useConsent = () => {
  // const consentToastId = useRef<string>()
  const isClient = typeof window !== 'undefined'
  if (!isClient) return {}
  const YT_CONSENT = 'yt-consent'
  const [consentValue, setConsentValue] = useState<string | null>(localStorage?.getItem(YT_CONSENT))

  const handleConsent = (value: 'true' | 'false') => {
    if (!isClient) return
    setConsentValue(value)
    localStorage.setItem(YT_CONSENT, value)

    // if (consentToastId.current) toast.dismiss(consentToastId.current)
  }

  // useEffect(() => {
  //   if (isClient && consentValue === null) {
  //     consentToastId.current = toast(
  //       <ConsentToast
  //         onAccept={() => handleConsent('true')}
  //         onOptOut={() => handleConsent('false')}
  //       />,
  //       {
  //         id: 'consent-toast',
  //         position: 'bottom-right',
  //         duration: Infinity,
  //       }
  //     )
  //   }
  // }, [consentValue])

  return { consentValue, setConsentValue, hasAcceptedConsent: consentValue === 'true' }
}
