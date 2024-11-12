import { useState } from 'react'
import { useKey } from 'react-use'

const useLWPartyMode = (disabled?: boolean) => {
  const [isPartyMode, setIsPartyMode] = useState<boolean>(true)

  useKey('p', () => setIsPartyMode(!isPartyMode), {}, [isPartyMode])
  useKey('Escape', () => setIsPartyMode(false), {}, [isPartyMode])

  return { isPartyMode, setIsPartyMode }
}

export default useLWPartyMode
