import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import cn from 'classnames'
import { SITE_ORIGIN } from '~/lib/constants'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import formStyles from './form.module.css'
import ticketFormStyles from './ticket-form.module.css'
import { Button, IconCheckCircle, IconLoader } from 'ui'
import { SupabaseClient } from '@supabase/supabase-js'

type FormState = 'default' | 'loading' | 'error'
type TicketGenerationState = 'default' | 'loading'

type Props = {
  defaultUsername?: string
  ticketGenerationState?: TicketGenerationState
  setTicketGenerationState: any
}

export default function TicketForm({ defaultUsername = '', setTicketGenerationState }: Props) {
  const [username, setUsername] = useState(defaultUsername)
  const [formState, setFormState] = useState<FormState>('default')
  const [errorMsg] = useState('')
  const { supabase, session, setUserData, setTicketState, userData } = useConfData()
  const [realtimeChannel, setRealtimeChannel] = useState<ReturnType<
    SupabaseClient['channel']
  > | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (supabase && session?.user && !userData.id) {
      document.body.classList.add('ticket-generated')
      const username = session.user.user_metadata.user_name
      setUsername(username)
      const name = session.user.user_metadata.full_name
      const email = session.user.email
      supabase
        .from('lw8_tickets')
        .insert({ email, name, username, referred_by: router.query?.referral ?? null })
        .eq('email', email)
        .select()
        .single()
        .then(async ({ error }: any) => {
          // If error because of duplicate email, ignore and proceed, otherwise sign out.
          if (error && error?.code !== '23505') return supabase.auth.signOut()
          const { data } = await supabase
            .from('lw8_tickets_golden')
            .select('*')
            .eq('username', username)
            .single()
          if (data) {
            setUserData(data)
          }
          setFormState('default')

          // Prefetch GitHub avatar
          new Image().src = `https://github.com/${username}.png`

          // Prefetch the twitter share URL to eagerly generate the page
          fetch(`/launch-week/8/tickets/${username}`).catch((_) => {})

          setTicketState('ticket')

          // Listen to realtime changes
          if (!realtimeChannel && !data?.golden) {
            const channel = supabase
              .channel('changes')
              .on(
                'postgres_changes',
                {
                  event: 'UPDATE',
                  schema: 'public',
                  table: 'lw8_tickets',
                  filter: `username=eq.${username}`,
                },
                (payload: any) => {
                  const golden = !!payload.new.sharedOnTwitter && !!payload.new.sharedOnLinkedIn
                  setUserData({
                    ...payload.new,
                    golden,
                  })
                  if (golden) {
                    channel.unsubscribe()
                  }
                }
              )
              .subscribe()
            setRealtimeChannel(channel)
          }
        })
    }
    return () => {
      // Cleanup realtime subscription on unmount
      realtimeChannel?.unsubscribe()
    }
  }, [session])

  return formState === 'error' ? (
    <div className="h-full">
      <div className={cn(formStyles['form-row'], ticketFormStyles['form-row'])}>
        <div className={cn(formStyles['input-label'], formStyles.error)}>
          <div className={cn(formStyles.input, formStyles['input-text'])}>{errorMsg}</div>
          <button
            type="button"
            className={cn(formStyles.submit, formStyles.error)}
            onClick={() => {
              setFormState('default')
              setTicketGenerationState('default')
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  ) : (
    <form
      ref={formRef}
      onSubmit={async (e) => {
        e.preventDefault()

        if (formState !== 'default') {
          setTicketGenerationState('default')
          setFormState('default')
          return
        }

        setFormState('loading')
        setTicketGenerationState('loading')

        await supabase?.auth.signInWithOAuth({
          provider: 'github',
          options: {
            redirectTo: `${SITE_ORIGIN}/launch-week/${
              userData.username ? '?referral=' + userData.username : ''
            }`,
          },
        })
      }}
      className="flex flex-col h-full items-center justify-center relative z-20"
    >
      <div className="flex flex-col gap-3">
        <div>
          <Button
            type="secondary"
            htmlType="submit"
            disabled={formState === 'loading' || Boolean(session)}
          >
            <span className={`flex items-center gap-2 ${username && 'text-muted'}`}>
              {session ? (
                <>
                  <IconCheckCircle />
                  Connect with GitHub
                </>
              ) : (
                <span className="flex items-center gap-2">
                  {formState === 'loading' && <IconLoader size={14} className="animate-spin" />}
                  Connect with GitHub
                </span>
              )}
            </span>
            {session ? <span className={ticketFormStyles.checkIcon}></span> : null}
          </Button>
        </div>
        {/* {!session && <p className={'text-xs text-muted'}>Only public info will be used.</p>} */}
      </div>
    </form>
  )
}
