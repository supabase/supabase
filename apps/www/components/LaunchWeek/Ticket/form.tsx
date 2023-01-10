import { useState, useCallback, useEffect } from 'react'
import cn from 'classnames'
import useConfData from '~/components/LaunchWeek/Ticket/hooks/use-conf-data'
import { useRouter } from 'next/router'
import LoadingDots from './loading-dots'
import styleUtils from './utils.module.css'
import styles from './form.module.css'
import useEmailQueryParam from '~/components/LaunchWeek/Ticket/hooks/use-email-query-param'
import { IconLoader } from '~/../../packages/ui'
// import Captcha, { useCaptcha } from './captcha'

type FormState = 'default' | 'loading' | 'error'

export type ConfUser = {
  id?: string
  email?: string
  ticketNumber?: number
  name?: string
  username?: string
  createdAt?: number
  golden?: boolean
}

type Props = {
  sharePage?: boolean
  align?: 'Left' | 'Center'
}

export default function Form({ sharePage, align = 'Center' }: Props) {
  const [email, setEmail] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [errorTryAgain, setErrorTryAgain] = useState(false)
  const [focused, setFocused] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formState, setFormState] = useState<FormState>('default')
  const { setPageState, setUserData, session, userData, supabase } = useConfData()
  const router = useRouter()
  const isCaptchaEnabled = false

  useEffect(() => {
    if (session?.user) {
      document.body.classList.add('ticket-generated')
      const username = session.user.user_metadata.user_name
      const name = session.user.user_metadata.full_name
      const email = session.user.email
      supabase
        .from('lw6_tickets')
        .upsert({ email, name, username }, { onConflict: 'email', ignoreDuplicates: false })
        .eq('email', email)
        .select()
        .single()
        .then(async ({ error }) => {
          if (error) return supabase.auth.signOut()
          const { data } = await supabase
            .from('lw6_tickets_golden')
            .select('*')
            .eq('username', username)
            .single()
          setUserData(data)
          setFormState('default')

          // Prefetch GitHub avatar
          new Image().src = `https://github.com/${username}.png`

          // Prefetch the twitter share URL to eagerly generate the page
          fetch(`/launch-week/tickets/${username}`).catch((_) => {})
          // Prefetch ticket og image.
          fetch(
            `https://obuldanrptloktxcffvn.functions.supabase.co/launchweek-ticket-og?username=${encodeURIComponent(
              username ?? ''
            )}`
          ).catch((_) => {})

          setPageState('ticket')
        })
    }
  }, [session])

  async function register(email: string, token?: string): Promise<ConfUser> {
    const { error } = await supabase!.from('lw6_tickets').insert({ email })
    if (error) {
      // console.log({ error })
      return {
        id: 'new',
        ticketNumber: 1234,
        name: '',
        username: '',
        golden: false,
      }
    }
    const { data } = await supabase!.from('lw6_tickets_golden').select('*').limit(1).single()
    return {
      id: data?.id ?? 'new',
      ticketNumber: data?.ticketNumber ?? 1234,
      name: data?.name ?? '',
      username: data?.username ?? '',
      golden: data?.golden ?? false,
    }
  }

  const handleRegister = useCallback(
    (token?: string) => {
      register(email, token)
        .then(async (params) => {
          if (!params) {
            throw new Error()
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
            await router.replace(`/launch-week/tickets?${queryString}`, '/launch-week/tickets')
          } else {
            setUserData(params)
            setPageState('ticket')
          }
        })
        .catch(async (err) => {
          let message = 'Error! Please try again.'

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
    <div className="flex flex-col gap-8">
      <div
        className={cn(
          styleUtils['appear-fifth'],
          'flex flex-col gap-2 items-center xl:items-start',
          align === 'Left' ? 'text-center xl:text-left' : 'text-center'
        )}
      >
        <p className="text-scale-1000 text-base max-w-[420px]">
          Register to get your ticket and stay tuned all week for daily announcements
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
          className="relative mx-auto xl:mx-0 w-full md:w-auto md:min-w-[320px] md:max-w-[420px]"
          onSubmit={onSubmit}
        >
          <input
            className={`
              transition-all
              border border-scale-300 bg-scaleA-200 h-10
              focus:border-scale-500 focus:ring-scaleA-300
              text-scale-1200 text-base rounded-full w-full px-5
            `}
            type="email"
            autoComplete="email"
            id="email-input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Enter email"
            aria-label="Your email address"
            required
          />
          <button
            type="submit"
            className={[
              'transition-all',
              'absolute bg-scale-300 text-scale-1200 border border-scale-600 text-sm hover:bg-scale-400',
              'rounded-full px-4',
              'focus:invalid:border-scale-500 focus:invalid:ring-scaleA-300',
              'absolute right-1 my-auto h-8 top-0 bottom-0',
            ].join(' ')}
            disabled={formState === 'loading'}
          >
            {formState === 'loading' ? (
              <div className="flex items-center gap-2">
                <IconLoader size={14} className="animate-spin" /> Registering
              </div>
            ) : (
              'Register'
            )}
          </button>
          {/* <Captcha ref={captchaRef} onVerify={handleRegister} /> */}
        </form>
      )}
    </div>
  )
}
