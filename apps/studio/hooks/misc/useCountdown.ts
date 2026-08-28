import { useEffect, useState } from 'react'

function secondsUntil(deadline: number | undefined) {
  if (deadline === undefined) return 0
  return Math.max(Math.ceil((deadline - Date.now()) / 1000), 0)
}

export function useCountdown(deadline: number | undefined) {
  const [remaining, setRemaining] = useState(() => secondsUntil(deadline))

  useEffect(() => {
    setRemaining(secondsUntil(deadline))
    if (deadline === undefined) return

    const intervalId = setInterval(() => {
      const next = secondsUntil(deadline)
      setRemaining(next)
      if (next === 0) clearInterval(intervalId)
    }, 1000)

    return () => clearInterval(intervalId)
  }, [deadline])

  return { remaining, isCountingDown: remaining > 0 }
}
