import { useState, useCallback, useEffect } from 'react'
import cn from 'classnames'
import useConfData from '~/components/LaunchWeek/Ticket/hooks/use-conf-data'
import { useRouter } from 'next/router'
import LoadingDots from './loading-dots'
import styleUtils from './utils.module.css'
import styles from './form.module.css'
import useEmailQueryParam from '~/components/LaunchWeek/Ticket/hooks/use-email-query-param'
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

          setPageState('ticket')
        })
    }
  }, [session])

  async function register(email: string, token?: string): Promise<ConfUser> {
    const { error } = await supabase!.from('lw6_tickets').insert({ email })
    if (error) {
      console.log({ error })
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
