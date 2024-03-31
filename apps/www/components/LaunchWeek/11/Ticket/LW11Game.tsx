import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react'
import { Button, cn } from 'ui'
import { SITE_ORIGIN } from '~/lib/constants'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import { VALID_KEYS } from '~/components/LaunchWeek/hooks/useLwGame'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from 'ui'

const REGEXP_ONLY_CHARS = '^[a-zA-Z]+$'

export function InputOTPDemo() {
  return (
    <InputOTP maxLength={6} pattern={REGEXP_ONLY_CHARS}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  )
}
const COMPLIMENTS = [
  'Congratulations!',
  'You won!',
  'Hurray!',
  'Great job!',
  'Nice job!',
  "That's right!",
]

interface Props {
  setIsGameMode: Dispatch<SetStateAction<boolean>>
}

const LWXGame = ({ setIsGameMode }: Props) => {
  const { supabase, userData: user } = useConfData()
  const word =
    process.env.NEXT_PUBLIC_LWX_GAME_WORD ?? 'supabase_is_going_into_general_availability'
  const phrase = 'supabase_is_going_into_general_availability'
  const inputRef = useRef(null)
  const winningWord = word?.split('')
  const winningPhrase = phrase?.split('_').map((word) => word.split(''))
  const phraseLength = phrase?.replaceAll('_', '').split('').length
  const [currentWord, setCurrentWord] = useState<string[]>(Array(winningWord.length))
  const [gameState, setGameState] = useState<'playing' | 'winner' | 'loading'>('playing')
  const [hasKeyDown, setHasKeyDown] = useState(false)
  const [attempts, setAttempts] = useState(1)
  const [value, setValue] = useState('')
  // const hasWon = currentWord.join('') === winningWord.join('').replaceAll('_', '')
  const hasWon = gameState === 'winner'
  const winningCompliment = useMemo(
    () => COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)],
    []
  )

  const searchAndAddToCurrentWord = (key: string) => {
    setAttempts(attempts + 1)

    for (let index = 0; index < winningWord?.length; index++) {
      const isAlreadyPresent = key === currentWord[index]
      if (isAlreadyPresent) return

      const isMatch = key === winningWord[index]

      if (isMatch) {
        const newCurrentWord = currentWord
        newCurrentWord[index] = key

        setCurrentWord(newCurrentWord)
        if (hasWon) setGameState('winner')
      }
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    const newKey = event.key.toLocaleLowerCase()

    if (!(event.metaKey || event.ctrlKey) && VALID_KEYS.includes(newKey)) {
      setHasKeyDown(true)
      searchAndAddToCurrentWord(newKey)
    }

    setTimeout(() => {
      setHasKeyDown(false)
    }, 100)
  }

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onKeyDown])

  async function handleGithubSignIn() {
    const redirectTo = `${SITE_ORIGIN}/launch-week/${
      user.username ? '?referral=' + user.username : ''
    }`

    supabase?.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo,
      },
    })
  }
  const handleClaimTicket = async (e: any) => {
    e.preventDefault()

    setGameState('loading')

    if (supabase) {
      if (user.id) {
        await supabase
          .from('lw11_tickets')
          .update({ gameWonAt: new Date() })
          .eq('username', user.username)
          .then((res) => {
            if (res.error) return console.log('error', res.error)
            setIsGameMode(false)
          })
      } else {
        localStorage.setItem('lw11_secret', 'true')

        handleGithubSignIn()
      }
    }
  }

  function handleIndexCount(word_idx: number, char_idx: number) {
    let index = -1
    for (let i = 0; i < word_idx + 1; i++) {
      const word = winningPhrase[i]

      for (let j = 0; j < word.length; j++) {
        if (i < word_idx || j <= char_idx) {
          index++
        }
      }
    }

    return index
  }

  if (gameState === 'loading')
    return (
      <div className="relative w-full mt-[100px] md:mt-44 lg:mt-32 xl:mt-32 2xl:mt-[120px] flex flex-col items-center gap-6 text-foreground">
        <svg
          className="animate-spinner opacity-50 w-5 h-5 md:w-6 md:h-6"
          width="100%"
          height="100%"
          viewBox="0 0 62 61"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M61 31C61 14.4315 47.5685 1 31 1C14.4315 1 1 14.4315 1 31"
            stroke="white"
            strokeWidth="2"
          />
        </svg>
      </div>
    )

  return (
    <div className="flex flex-col items-center text-center gap-12 md:gap-16 max-w-6xl">
      <div className="flex flex-col items-center h-10 text-foreground-light">
        <div
          className={cn(
            'absolute flex flex-col gap-2 opacity-0 translate-y-2 transition-all',
            hasWon && 'opacity-100 translate-y-0'
          )}
        >
          <p className="tracking-wider text-foreground text-lg font-mono uppercase">
            {winningCompliment}
          </p>
          <p className="text-foreground-lighter font-san text-sm">
            Claim and share the secret ticket to boost your chances of winning swag.
          </p>
        </div>
        <div
          className={cn(
            'absolute flex justify-center opacity-0 translate-y-2 transition-all',
            !hasWon && 'opacity-100 translate-y-0'
          )}
        >
          Guess the word
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 flex-wrap font-mono min-h-[100px]">
        <InputOTP
          ref={inputRef}
          maxLength={phraseLength}
          pattern={REGEXP_ONLY_CHARS}
          autoFocus
          containerClassName="flex-wrap justify-center gap-y-4"
          value={value}
          onChange={(e) => {
            // @ts-ignore
            const index = inputRef.current?.dataset.inputOtpMss
            const valueAtPhraseIndex = phrase?.replaceAll('_', '').split('')[index]
            const currentVal = e.split('')[e.length - 1]
            const isMatch = valueAtPhraseIndex === currentVal

            if (isMatch) {
              setValue(e)
            }
          }}
          onComplete={() => setGameState('winner')}
        >
          {winningPhrase.map((word, w_idx) => (
            <>
              <InputOTPGroup key={`${word.join('')}-${w_idx}`}>
                {word.map((_, c_idx) => {
                  // index is sum of every letter of every previous word + index of current wo
                  const currentIndex = handleIndexCount(w_idx, c_idx)
                  return (
                    <InputOTPSlot
                      className={cn(
                        hasWon && 'border-foreground-light animate-pulse',
                        hasKeyDown && 'border-strong'
                      )}
                      key={`otp-${currentIndex}`}
                      index={currentIndex}
                    />
                  )
                })}
              </InputOTPGroup>
              {w_idx !== winningPhrase.length - 1 && <InputOTPSeparator className="mx-1" />}
            </>
          ))}
        </InputOTP>
        {/* {winningWord.map((letter, i) => {
          const isSpace = letter === '_'
          const isMatch = isSpace || letter === currentWord[i]

          return (
            <div
              key={`${currentWord[i]}-${i}`}
              className={cn(
                'w-6 md:w-14 aspect-square bg-[#06080930] backdrop-blur-sm flex items-center hover:border-strong justify-center uppercase border rounded-sm md:rounded-lg transition-colors',
                isMatch && 'border-stronger bg-foreground text-[#060809]',
                hasWon && 'animate-pulse !border-foreground',
                hasKeyDown && 'border-strong',
                isSpace && '!opacity-0'
              )}
            >
              {currentWord[i]}
            </div>
          )
        })} */}
        {/* {winningWord.map((letter, i) => {
          const isSpace = letter === '_'
          const isMatch = isSpace || letter === currentWord[i]

          return (
            <div
              key={`${currentWord[i]}-${i}`}
              className={cn(
                'w-6 md:w-14 aspect-square bg-[#06080930] backdrop-blur-sm flex items-center hover:border-strong justify-center uppercase border rounded-sm md:rounded-lg transition-colors',
                isMatch && 'border-stronger bg-foreground text-[#060809]',
                hasWon && 'animate-pulse !border-foreground',
                hasKeyDown && 'border-strong',
                isSpace && '!opacity-0'
              )}
            >
              {currentWord[i]}
            </div>
          )
        })} */}
      </div>
      <form onSubmit={handleClaimTicket} className="flex flex-col items-center h-10">
        <Button
          type="secondary"
          onClick={() => null}
          htmlType="submit"
          className={cn(
            'absolute opacity-0 translate-y-2 transition-all',
            hasWon && 'opacity-100 translate-y-0'
          )}
        >
          Claim secret ticket
        </Button>
      </form>
      <div className="flex gap-4 md:gap-10 items-center h-10 text-xs text-foreground-lighter">
        <div className="flex items-center gap-2">
          <Button
            type="outline"
            onClick={() => null}
            disabled
            className="pointer-events-none"
            size="tiny"
          >
            A-Z
          </Button>
          <span>Play</span>
        </div>
        <div className="flex items-center gap-2 text-foreground-muted">
          <Button
            type="outline"
            onClick={() => null}
            disabled
            className="pointer-events-none"
            size="tiny"
          >
            Esc
          </Button>
          <span>Exit</span>
        </div>
      </div>
    </div>
  )
}

export default LWXGame
