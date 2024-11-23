// ============================================
// ============ 🏆 SECRET CODE 🏆 ==============
// ============================================

const SUPA_SECRET_CODE = 'ship'

// ============================================
// == TYPE IT IN WHEN THE TICKET IS FLIPPED ===
// ============================================

import { RefObject, useEffect, useState } from 'react'
import { SITE_ORIGIN } from '~/lib/constants'
import useConfData from './use-conf-data'

const useLwGame = (inputRef?: RefObject<HTMLInputElement>, disabled?: boolean) => {
  const { supabase, userData: user } = useConfData()
  const [isGameMode, setIsGameMode] = useState<boolean>(false)
  const [gameState, setGameState] = useState<'playing' | 'winner' | 'loading'>('playing')
  const [value, setValue] = useState<string>('')

  const phraseLength = SUPA_SECRET_CODE?.replaceAll('_', '').split('').length
  const winningPhrase = SUPA_SECRET_CODE?.split('_').map((word) => word.split(''))
  const hasWon = user.secret || gameState === 'winner'

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!inputRef?.current) return

    const newKey = event.key.toLocaleLowerCase()
    const index = (inputRef.current as HTMLInputElement).dataset.inputOtpMss
    const valueAtPhraseIndex = SUPA_SECRET_CODE?.replaceAll('_', '').split('')[parseInt(index!)]
    const isMatch = valueAtPhraseIndex === newKey

    if (isMatch) {
      setValue(value + newKey)
    }
  }

  const handleGithubSignIn = async () => {
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
    e?.preventDefault()
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
        handleGithubSignIn()
      }
    }
  }

  const handleIndexCount = (word_idx: number, char_idx: number) => {
    let index = -1

    for (let i = 0; i < word_idx + 1; i++) {
      const word = winningPhrase[i]
      for (let j = 0; j < word.length; j++) {
        if (i < word_idx || j <= char_idx) index++
      }
    }

    return index
  }

  // Trigger secret ticket when word is typed correctly
  useEffect(() => {
    if (gameState === 'winner') {
      handleClaimTicket(null)
    }
  }, [gameState])

  useEffect(() => {
    if (hasWon || disabled) return
    if (!!inputRef?.current && isGameMode) {
      inputRef?.current?.focus()
    }
  }, [isGameMode, hasWon, disabled])

  useEffect(() => {
    if (user.secret) {
      setValue(SUPA_SECRET_CODE)
    }
  }, [])

  useEffect(() => {
    if (!disabled) window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [disabled, value])

  return {
    isGameMode,
    setIsGameMode,
    setGameState,
    handleClaimTicket,
    value,
    hasWon,
    winningPhrase,
    phraseLength,
    REGEXP_ONLY_CHARS,
    handleIndexCount,
  }
}

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

export default useLwGame
