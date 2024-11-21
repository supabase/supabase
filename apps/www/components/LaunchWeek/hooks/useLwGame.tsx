import { Ref, RefObject, useEffect, useMemo, useState } from 'react'
import useConfData from './use-conf-data'
import { SITE_ORIGIN } from '../../../lib/constants'

export const VALID_KEYS = [
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

const REGEXP_ONLY_CHARS = '^[a-zA-Z]+$'

const COMPLIMENTS = [
  'Congratulations!',
  'You won!',
  'Hurray!',
  'Great job!',
  'Nice job!',
  "That's right!",
]

const useLwGame = (inputRef: RefObject<HTMLInputElement>, disabled?: boolean) => {
  const [isGameMode, setIsGameMode] = useState(false)
  const { supabase, userData: user } = useConfData()
  // ======== SECRET CODE ========
  const phrase = 'SHIP'
  // ======== SECRET CODE ========
  const winningPhrase = phrase?.split('_').map((word) => word.split(''))
  const phraseLength = phrase?.replaceAll('_', '').split('').length
  const [gameState, setGameState] = useState<'playing' | 'winner' | 'loading'>('playing')
  const [hasKeyDown, setHasKeyDown] = useState(false)
  const [value, setValue] = useState('')
  const hasWon = gameState === 'winner'
  const winningCompliment = useMemo(
    () => COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)],
    []
  )

  function onKeyDown(event: KeyboardEvent) {
    if (!inputRef.current) return
    const newKey = event.key.toLocaleLowerCase()

    if (!(event.metaKey || event.ctrlKey) && VALID_KEYS.includes(newKey)) {
      setHasKeyDown(true)
    }

    setTimeout(() => {
      setHasKeyDown(false)
    }, 100)

    const index = (inputRef.current as HTMLInputElement).dataset.inputOtpMss
    const valueAtPhraseIndex = phrase?.replaceAll('_', '').split('')[parseInt(index!)]
    const isMatch = valueAtPhraseIndex === newKey

    if (isMatch) {
      setValue(value + newKey)
    }
  }

  useEffect(() => {
    if (!disabled) window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [disabled, value])

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
          .from('tickets')
          .update({ game_won_at: new Date() })
          .eq('launch_week', 'lw13')
          .eq('username', user.username)
          .then((res) => {
            if (res.error) return console.log('error', res.error)
            setIsGameMode(false)
          })

        await fetch(`/api-v2/ticket-og?username=${user.username}&secret=true`)
      } else {
        localStorage.setItem('lw13_secret', 'true')

        handleGithubSignIn()
      }
    }
  }

  function handleIndexCount(word_idx: number, char_idx: number) {
    let index = -1

    for (let i = 0; i < word_idx + 1; i++) {
      const word = winningPhrase[i]
      for (let j = 0; j < word.length; j++) {
        if (i < word_idx || j <= char_idx) index++
      }
    }

    return index
  }

  return {
    isGameMode,
    setIsGameMode,
    gameState,
    setGameState,
    value,
    hasKeyDown,
    hasWon,
    winningCompliment,
    winningPhrase,
    phrase,
    phraseLength,
    REGEXP_ONLY_CHARS,
    handleIndexCount,
  }
}

export default useLwGame
