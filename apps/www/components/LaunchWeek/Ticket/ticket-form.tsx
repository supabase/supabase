import { useState, useRef } from 'react'
// import { scrollTo } from '@lib/smooth-scroll';
import cn from 'classnames'
// import GithubIcon from '~/components/LaunchWeek/Ticket/icons/icon-github'
// import CheckIcon from '~/components/LaunchWeek/Ticket/icons/icon-check'
import { SITE_ORIGIN } from '~/lib/constants'
import useConfData from '~/components/LaunchWeek/Ticket//hooks/use-conf-data'
import LoadingDots from './loading-dots'
import formStyles from './form.module.css'
import ticketFormStyles from './ticket-form.module.css'

type FormState = 'default' | 'loading' | 'error'
type TicketGenerationState = 'default' | 'loading'

type Props = {
  defaultUsername?: string
  setTicketGenerationState: React.Dispatch<React.SetStateAction<TicketGenerationState>>
}

export default function Form({ defaultUsername = '', setTicketGenerationState }: Props) {
  const [username] = useState(defaultUsername)
  const [formState, setFormState] = useState<FormState>('default')
  const [errorMsg] = useState('')
  const { supabase } = useConfData()
  const formRef = useRef<HTMLFormElement>(null)

  return formState === 'error' ? (
    <div>
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

        await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: { redirectTo: `${SITE_ORIGIN}/launch-week/tickets` },
        })
      }}
      className="flex flex-col items-center xl:block"
    >
      <div className="flex flex-col gap-3">
        <div>
          <button
            type="submit"
            className="rounded-full bg-scale-400 py-1 px-3 border border-scale-500 dark:text-white text-sm mb-1 transition-all ease-out hover:bg-scale-500"
            disabled={formState === 'loading' || Boolean(username)}
          >
            <span className={`${username && 'text-scale-900'}`}>
              {username ? 'Done!' : 'Connect with GitHub'}
            </span>
            {username ? <span className={ticketFormStyles.checkIcon}></span> : null}
          </button>
        </div>
        {!username && <p className={'text-xs text-scale-900'}>Only public info will be used.</p>}
      </div>
    </form>
  )
}
