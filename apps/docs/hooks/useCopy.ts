import { useState } from 'react'

export function useCopy() {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 1000)
  }

  return { copied, handleCopy }
}
