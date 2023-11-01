import HCaptcha from '@hcaptcha/react-hcaptcha'
import { proxy, useSnapshot } from 'valtio'

const hCaptchaLoadedStoreState = proxy({
  loaded: false,
  setLoaded() {
    hCaptchaLoadedStoreState.loaded = true
  },
})

export const useIsHCaptchaLoaded = () => {
  const snap = useSnapshot(hCaptchaLoadedStoreState)

  return snap.loaded
}

const HCaptchaLoadedStore = () => {
  const onLoad = () => {
    hCaptchaLoadedStoreState.setLoaded()
  }

  return (
    <HCaptcha
      sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
      size="invisible"
      onLoad={onLoad}
    />
  )
}

export default HCaptchaLoadedStore
