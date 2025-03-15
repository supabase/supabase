import { useState } from "react"

export const usePartymode = () => {
  const [on, setOn] = useState(false)

  return {
    state: {
      on
    },
    toggle: () => {
      setOn(!on)
    }
  }
}

