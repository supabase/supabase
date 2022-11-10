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

import { useState, useCallback } from 'react'
import cn from 'classnames'
import useConfData from '~/components/LaunchWeek/Ticket/hooks/use-conf-data'
import { useRouter } from 'next/router'
import LoadingDots from './loading-dots'
import styleUtils from './utils.module.css'
import styles from './form.module.css'
import useEmailQueryParam from '~/components/LaunchWeek/Ticket/hooks/use-email-query-param'
import { register } from '~/lib/launch-week-ticket/user-api'
// import Captcha, { useCaptcha } from './captcha'

type FormState = 'default' | 'loading' | 'error'

type Props = {
  sharePage?: boolean
  align?: 'Left' | 'Center'
}

class FormError extends Error {
  constructor(public res: Response) {
    super()
  }
}

export default function Form({ sharePage, align = 'Center' }: Props) {
  const [email, setEmail] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [errorTryAgain, setErrorTryAgain] = useState(false)
  const [focused, setFocused] = useState(false)
  const [formState, setFormState] = useState<FormState>('default')
  const { setPageState, setUserData } = useConfData()
  const router = useRouter()
  const isCaptchaEnabled = false
  // const {
  //   ref: captchaRef,
  //   execute: executeCaptcha,
  //   reset: resetCaptcha,
  //   isEnabled: isCaptchaEnabled,
  // } = useCaptcha()

  const handleRegister = useCallback(
    (token?: string) => {
      register(email, token)
        .then(async (res) => {
          if (!res.ok) {
            throw new FormError(res)
          }

          const data = await res.json()
          const params = {
            id: data.id,
            ticketNumber: data.ticketNumber,
            name: data.name,
            username: data.username,
            golden: data.golden ?? false,
          }

          if (sharePage) {
            const queryString = Object.keys(params)
              .map(
                (key) =>
                  `${encodeURIComponent(key)}=${encodeURIComponent(
                    params[key as keyof typeof params] || ''
                  )}`
              )
              .join('&')
            await router.replace(`/?${queryString}`, '/')
          } else {
            setUserData(params)
            setPageState('ticket')
          }
        })
        .catch(async (err) => {
          let message = 'Error! Please try again.'

          if (err instanceof FormError) {
            const { res } = err
            const data = res.headers.get('Content-Type')?.includes('application/json')
              ? await res.json()
              : null

            if (data?.error?.code === 'bad_email') {
              message = 'Please enter a valid email'
            }
          }

          setErrorMsg(message)
          setFormState('error')
        })
    },
    [email, router, setPageState, setUserData, sharePage]
  )

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      if (formState === 'default') {
        setFormState('loading')

        if (isCaptchaEnabled) {
          // return executeCaptcha()
        }

        return handleRegister()
      } else {
        setFormState('default')
      }
    },
    [formState, isCaptchaEnabled, handleRegister]
  )

  const onTryAgainClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()

    setFormState('default')
    setErrorTryAgain(true)
    // resetCaptcha()
  }, [])

  useEmailQueryParam('email', setEmail)

  return (
    <>
      <div
        className={cn(
          styleUtils.appear,
          styleUtils['appear-fifth'],
          [styles.formInfo, styles[`formInfo${align}`]].join(' ')
        )}
      >
        <h3>Get a ticket</h3>
        <p>
          A few of the lucky attendees will get a limited edition Supabase goodie bag. Make sure you
          don’t skip your chance.
        </p>
      </div>
      {formState === 'error' ? (
        <div
          className={cn(styles.form, {
            [styles['share-page']]: sharePage,
          })}
        >
          <div className={styles['form-row']}>
            <div className={cn(styles['input-label'], styles.error)}>
              <div className={cn(styles.input, styles['input-text'])}>{errorMsg}</div>
              <button
                type="button"
                className={cn(styles.submit, styles.register, styles.error)}
                onClick={onTryAgainClick}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form
          className={cn(styles.form, styles[`form${align}`], {
            [styles['share-page']]: sharePage,
            [styleUtils.appear]: !errorTryAgain,
            [styleUtils['appear-fifth']]: !errorTryAgain && !sharePage,
            [styleUtils['appear-third']]: !errorTryAgain && sharePage,
          })}
          onSubmit={onSubmit}
        >
          <div className={styles['form-row']}>
            <label
              htmlFor="email-input-field"
              className={cn(styles['input-label'], {
                [styles.focused]: focused,
              })}
            >
              <input
                className={styles.input}
                autoComplete="off"
                type="email"
                id="email-input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Enter email to register free"
                aria-label="Your email address"
                required
              />
            </label>
            <button
              type="submit"
              className={cn(styles.submit, styles.register, styles[formState])}
              disabled={formState === 'loading'}
            >
              {formState === 'loading' ? <LoadingDots size={4} /> : <>Register</>}
            </button>
          </div>
          {/* <Captcha ref={captchaRef} onVerify={handleRegister} /> */}
        </form>
      )}
    </>
  )
}
