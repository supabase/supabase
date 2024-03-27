import { useEffect } from 'react'

const useCleanup = (cb: (() => void) | undefined) => {
  useEffect(() => cb, [cb])
}

export { useCleanup }
