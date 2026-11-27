import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'

import { PRODUCT } from './config'
import { ensureSession } from './session'
import { ThemeSwitch } from './ThemeSwitch'
import {
  fetchStatus,
  joinWaitlist,
  leaveWaitlist,
  subscribeToChanges,
  type WaitlistStatus,
} from './waitlist'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; waitlist: WaitlistStatus }

const referralCode = new URLSearchParams(window.location.search).get('ref')

export function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  const refresh = useCallback(async () => {
    try {
      setState({ status: 'ready', waitlist: await fetchStatus() })
    } catch (error) {
      setState({ status: 'error', message: error instanceof Error ? error.message : 'Failed' })
    }
  }, [])

  // Sign in, load the list, and refresh whenever the database broadcasts a change.
  useEffect(() => {
    let unsubscribe = () => {}
    ensureSession()
      .then(() => {
        refresh()
        unsubscribe = subscribeToChanges(refresh)
      })
      .catch((error: Error) => setState({ status: 'error', message: error.message }))
    return () => unsubscribe()
  }, [refresh])

  const total = state.status === 'ready' ? state.waitlist.total : null

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(60%_70%_at_50%_0%,color-mix(in_oklab,var(--color-amber-400)_25%,transparent),transparent_70%)] dark:bg-[radial-gradient(60%_70%_at_50%_0%,color-mix(in_oklab,var(--color-amber-400)_14%,transparent),transparent_70%)]"
      />
      <header className="flex items-center gap-2 px-6 py-5">
        <span className="size-5 rounded-full bg-gradient-to-br from-amber-300 to-orange-500" />
        <span className="font-medium">{PRODUCT.name}</span>
        <div className="ml-auto">
          <ThemeSwitch />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-10 px-6 pb-16 pt-10 text-center">
        <div className="flex flex-col items-center gap-4">
          <LiveCount total={total} />
          <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
            {PRODUCT.headline}
          </h1>
          <p className="max-w-lg text-balance text-lg text-subtle">{PRODUCT.description}</p>
        </div>

        {state.status === 'loading' && <p className="text-sm text-muted">Loading…</p>}
        {state.status === 'error' && (
          <p className="text-sm text-red-500">Couldn’t load the waitlist: {state.message}</p>
        )}
        {state.status === 'ready' && !state.waitlist.me && <JoinForm onJoined={refresh} />}
        {state.status === 'ready' && state.waitlist.me && (
          <JoinedCard waitlist={state.waitlist} onLeft={refresh} />
        )}

        <ol className="grid w-full gap-4 text-left sm:grid-cols-3">
          {PRODUCT.steps.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-line bg-card/70 p-4">
              <span className="font-mono text-xs text-muted">0{index + 1}</span>
              <p className="mt-2 text-sm font-medium">{step.title}</p>
              <p className="mt-1 text-sm text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </main>
    </div>
  )
}

function LiveCount({ total }: { total: number | null }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs text-subtle">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
      </span>
      {total === null && 'Loading the waitlist'}
      {total === 0 && 'Be the first on the list'}
      {total !== null &&
        total > 0 &&
        `${total.toLocaleString()} ${total === 1 ? 'person' : 'people'} on the waitlist`}
    </span>
  )
}

function JoinForm({ onJoined }: { onJoined: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await joinWaitlist({ name, email, ref: referralCode })
      onJoined()
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Could not join')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3">
      {referralCode && (
        <p className="text-sm text-subtle">A friend invited you. Join to give them a boost.</p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          aria-label="Your name"
          required
          maxLength={60}
          className="flex-1 rounded-xl border border-line bg-card px-4 py-3 text-sm placeholder:text-muted focus:border-line-strong focus:outline-none"
        />
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          aria-label="Email"
          required
          className="flex-[1.4] rounded-xl border border-line bg-card px-4 py-3 text-sm placeholder:text-muted focus:border-line-strong focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving your spot…' : PRODUCT.cta}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <p className="text-xs text-muted">
        We’ll only email you about the launch. This demo clears the list every night.
      </p>
    </form>
  )
}

function JoinedCard({ waitlist, onLeft }: { waitlist: WaitlistStatus; onLeft: () => void }) {
  const me = waitlist.me!
  const link = `${window.location.origin}${window.location.pathname}?ref=${me.referral_code}`

  return (
    <div className="flex w-full max-w-md flex-col gap-5 rounded-3xl border border-line bg-card p-6 text-left shadow-sm">
      <div>
        <p className="text-sm text-muted">You’re on the list, {me.name.split(' ')[0]}.</p>
        <p className="mt-1 text-4xl font-semibold tabular-nums">
          #{me.position.toLocaleString()}
          <span className="ml-2 text-base font-normal text-muted">
            of {waitlist.total.toLocaleString()}
          </span>
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm">{PRODUCT.referralCopy}</p>
        <CopyField value={link} />
        <p className="text-xs text-muted">
          {me.referrals === 0
            ? 'No one has joined with your link yet.'
            : `${me.referrals} ${me.referrals === 1 ? 'friend has' : 'friends have'} joined with your link.`}
        </p>
      </div>
      <Leaderboard entries={waitlist.leaderboard} />
      <button
        type="button"
        onClick={async () => {
          await leaveWaitlist()
          onLeft()
        }}
        className="self-start text-xs text-muted underline-offset-4 hover:text-foreground hover:underline"
      >
        Leave the waitlist
      </button>
    </div>
  )
}

function CopyField({ value }: { value: string }) {
  const [isCopied, setIsCopied] = useState(false)
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-surface p-1 pl-3">
      <span className="flex-1 truncate font-mono text-xs">{value}</span>
      <button
        type="button"
        onClick={() =>
          navigator.clipboard.writeText(value).then(() => {
            setIsCopied(true)
            window.setTimeout(() => setIsCopied(false), 1500)
          })
        }
        className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background"
      >
        {isCopied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  )
}

function Leaderboard({ entries }: { entries: WaitlistStatus['leaderboard'] }) {
  if (entries.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Top referrers</p>
      <ol className="flex flex-col gap-1">
        {entries.map((entry, index) => (
          <Row key={index} isMe={entry.is_me}>
            <span className="w-5 text-muted tabular-nums">{index + 1}</span>
            <span className="flex-1">{entry.is_me ? 'You' : (entry.initials ?? 'Someone')}</span>
            <span className="tabular-nums text-muted">{entry.referrals}</span>
          </Row>
        ))}
      </ol>
    </div>
  )
}

function Row({ isMe, children }: { isMe: boolean; children: ReactNode }) {
  return (
    <li
      className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm ${isMe ? 'bg-amber-400/15' : ''}`}
    >
      {children}
    </li>
  )
}
