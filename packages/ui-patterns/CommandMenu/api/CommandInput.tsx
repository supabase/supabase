'use client'

import React, { forwardRef, useEffect, useRef, useState } from 'react'

import { useBreakpoint } from 'common'
import { CommandInput_Shadcn_, cn } from 'ui'

import { useQuery, useSetQuery } from './hooks/queryHooks'

function useFocusInputOnWiderScreens(ref: React.ForwardedRef<HTMLInputElement>) {
  const isBelowSm = useBreakpoint('sm')
  const isBelowSmSynchronous = useRef(isBelowSm)
  isBelowSmSynchronous.current = isBelowSm

  const internalRef = useRef<HTMLInputElement>()
  const combinedRef = (element: HTMLInputElement) => {
    if (ref instanceof Function) {
      ref(element)
    } else if (!!ref) {
      ref.current = element
    }
    internalRef.current = element
  }

  useEffect(() => {
    // This will always be false in the first iteration (since isBelowSm
    // switches from false -> true on narrow screens). To avoid a preemptive
    // focus, we need to delay this. But then we need to access the current
    // value of isBelowSm, not the stale value, which explains the business
    // with syncing state into a ref above.
    setTimeout(() => {
      if (!isBelowSmSynchronous.current) {
        internalRef.current?.focus()
      }
    })
  }, [])

  return combinedRef
}

const CommandInput = forwardRef<
  React.ElementRef<typeof CommandInput_Shadcn_>,
  React.ComponentPropsWithoutRef<typeof CommandInput_Shadcn_>
>(({ className, ...props }, ref) => {
  const inputRef = useFocusInputOnWiderScreens(ref)

  const query = useQuery()
  const setQuery = useSetQuery()

  const [inputValue, setInputValue] = useState(query)
  useEffect(() => {
    setInputValue(query)
  }, [query])

  // To handle CJK input
  const [imeComposing, setImeComposing] = useState(false)
  useEffect(() => {
    if (!imeComposing) {
      setQuery(inputValue)
    }
  }, [inputValue, imeComposing])

  return (
    <CommandInput_Shadcn_
      // Focus needs to be manually handled to check breakpoint first, due to
      // delays from useEffect
      autoFocus={false}
      ref={inputRef}
      value={inputValue}
      onValueChange={setInputValue}
      placeholder="Type a command or search..."
      onCompositionStart={() => setImeComposing(true)}
      onCompositionEnd={() => setImeComposing(false)}
      className={cn(
        'flex h-11 w-full rounded-md bg-transparent px-4 py-7 outline-none',
        'focus:shadow-none focus:ring-transparent',
        'text-base text-foreground-light placeholder:text-foreground-muted disabled:cursor-not-allowed disabled:opacity-50 border-0',
        className
      )}
      {...props}
    />
  )
})

CommandInput.displayName = CommandInput_Shadcn_.displayName

export { CommandInput }
