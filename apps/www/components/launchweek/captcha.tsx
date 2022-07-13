/**
 * Copyright 2020 Vercel Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type HCaptcha from '@hcaptcha/react-hcaptcha'
import { IS_CAPTCHA_ENABLED } from '~/lib/launchweek/captcha'

import { ComponentProps, Suspense, forwardRef, useCallback, useRef, lazy } from 'react'

type Props = Omit<ComponentProps<typeof HCaptcha>, 'sitekey'>

const LazyCaptcha = lazy(() => import('@hcaptcha/react-hcaptcha'))

export function useCaptcha() {
  const ref = useRef<HCaptcha>(null)

  const execute = useCallback(() => ref.current?.execute(), [])
  const reset = useCallback(() => ref.current?.resetCaptcha(), [])

  return { ref, execute, reset, isEnabled: IS_CAPTCHA_ENABLED }
}

const Captcha = forwardRef<HCaptcha, Props>((props, ref) => {
  if (!IS_CAPTCHA_ENABLED) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <LazyCaptcha
        ref={ref}
        sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY as string}
        size="invisible"
        {...props}
      />
    </Suspense>
  )
})

export default Captcha
