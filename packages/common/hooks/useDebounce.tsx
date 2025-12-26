'use client'

import { debounce } from 'lodash'
import { useEffect, useMemo, useRef } from 'react'

export const useDebounce = (callback: () => void, delay: number = 1000) => {
  const ref = useRef<any>()

  useEffect(() => {
    ref.current = callback
  }, [callback])

  const debouncedCallback = useMemo(() => {
    const func = () => {
      ref.current?.()
    }

    return debounce(func, delay)
  }, [])

  return debouncedCallback
}
