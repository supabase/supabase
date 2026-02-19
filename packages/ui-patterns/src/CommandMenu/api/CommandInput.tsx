'use client'

import { useBreakpoint, useDebounce } from 'common'
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import type React from 'react'
import { cn, CommandInput_Shadcn_ } from 'ui'

import { useQuery, useSetQuery } from './hooks/queryHooks'
import { useCommandMenuTelemetryContext } from './hooks/useCommandMenuTelemetryContext'

const INPUT_TYPED_EVENT_DEBOUNCE_TIME = 2000 // 2s

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
    previousValueRef.current = query
  }, [query])

  // Get telemetry context
  const telemetryContext = useCommandMenuTelemetryContext()
  const previousValueRef = useRef<string>(inputValue)

  const inputTelemetryEvent = useCallback(
    (value: string) => {
      if (telemetryContext?.onTelemetry) {
        const event = {
          action: 'command_menu_search_submitted' as const,
          properties: {
            value: value,
            app: telemetryContext.app,
          },
          groups: {},
        }
        telemetryContext.onTelemetry(event)
      }
    },
    [telemetryContext]
  )

  const debouncedTelemetry = useDebounce(
    useCallback(() => {
      inputTelemetryEvent(inputValue)
      previousValueRef.current = inputValue
    }, [inputTelemetryEvent, inputValue]),
    INPUT_TYPED_EVENT_DEBOUNCE_TIME
  )

  const handleValueChange = useCallback(
    (value: string) => {
      setInputValue(value)

      // Only trigger telemetry if the user is adding characters (not removing with backspace)
      const isAddingCharacters = value.length > previousValueRef.current.length

      if (!isAddingCharacters) {
        previousValueRef.current = value
        return
      }

      // Trigger debounced telemetry
      debouncedTelemetry()
    },
    [debouncedTelemetry]
  )

  // To handle CJK input
  const [imeComposing, setImeComposing] = useState(false)
  useEffect(() => {
    if (!imeComposing) {
      setQuery(inputValue)
    }
  }, [inputValue, imeComposing])

  return (
    <div className="relative w-full" cmdk-input-wrapper="">
      <CommandInput_Shadcn_
        // Focus needs to be manually handled to check breakpoint first, due to
        // delays from useEffect
        autoFocus={false}
        ref={inputRef}
        value={inputValue}
        onValueChange={handleValueChange}
        placeholder="Run a command or search..."
        onCompositionStart={() => setImeComposing(true)}
        onCompositionEnd={() => setImeComposing(false)}
        className={cn(
          'flex h-11 w-full rounded-md bg-transparent px-2 py-7 outline-none',
          'focus:shadow-none focus:ring-transparent',
          'text-base text-foreground-light placeholder:text-foreground-muted disabled:cursor-not-allowed disabled:opacity-50 border-0',
          className
        )}
        {...props}
      />
    </div>
  )
})

CommandInput.displayName = CommandInput_Shadcn_.displayName

export { CommandInput }
