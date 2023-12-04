import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import useConfData from '../../hooks/use-conf-data'
import { Button, cn } from 'ui'

const VALID_KEYS = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
]

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
  const {
    supabase,
    userData: user,
    setTicketState,
    showCustomizationForm,
    setShowCustomizationForm,
  } = useConfData()
  const winningWord = 'database'.split('')
  const [currentWord, setCurrentWord] = useState<string[]>(Array(winningWord.length))
  const [gameState, setGameState] = useState<'playing' | 'winner'>('playing')
  const [hasKeyDown, setHasKeyDown] = useState(false)
  const [attempts, setAttempts] = useState(1)
  const hasWon = currentWord.join('') === winningWord.join('')
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

    if (hasWon && newKey === 'Enter') {
      handleClaimTicket(null)
    }

    setTimeout(() => {
      setHasKeyDown(false)
    }, 100)
  }

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
  }, [onKeyDown])

  const handleClaimTicket = async (e: any) => {
    e.preventDefault()

    setTicketState('loading')

    if (supabase && user) {
      await supabase
        .from('lwx_tickets')
        .update({ metadata: { ...user.metadata, hasSecretTicket: hasWon } })
        .eq('username', user.username)
        .then((res) => {
          if (res.error) return console.log('error', res.error)
          setIsGameMode(false)
        })
    }
  }

  return (
    <div className="flex flex-col items-center text-center gap-12 md:gap-16">
      <div className="flex flex-col items-center h-10 text-foreground-light">
        <div
          className={cn(
            'absolute flex flex-col gap-2 opacity-0 translate-y-2 transition-all',
            hasWon && 'opacity-100 translate-y-0'
          )}
        >
          <p className="tracking-wider text-foreground font-mono uppercase">{winningCompliment}</p>
          <p className="text-foreground-lighter font-san text-sm">
            Claim and share the secret ticket to increase your chances of winning swag.
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
      <div className="flex items-center justify-center gap-2 flex-wrap font-mono h-16">
        {winningWord.map((letter, i) => {
          const isMatch = letter === currentWord[i]
          return (
            <div
              key={`${currentWord[i]}-${i}`}
              className={cn(
                'w-6 md:w-14 aspect-square bg-[#06080930] backdrop-blur-sm flex items-center hover:border-strong justify-center uppercase border rounded-sm md:rounded-lg transition-colors',
                isMatch && 'border-stronger',
                hasWon && 'animate-pulse !border-foreground',
                hasKeyDown && 'border-strong'
              )}
            >
              {currentWord[i]}
            </div>
          )
        })}
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
