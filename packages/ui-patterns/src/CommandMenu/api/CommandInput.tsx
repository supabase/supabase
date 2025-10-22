'use client'

import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import type React from 'react'

import { useBreakpoint } from 'common'
import { CommandInput_Shadcn_, cn } from 'ui'

import { useQuery, useSetQuery } from './hooks/queryHooks'
import { useCommandMenuTelemetryContext } from './hooks/useCommandMenuTelemetryContext'

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

  // Debounced telemetry tracking
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()
  const previousValueRef = useRef<string>(inputValue)

  const logTelemetryEvent = useCallback(
    (value: string) => {
      if (telemetryContext?.onTelemetry) {
        // Create a CommandInputTypedEvent
        const event = {
          action: 'command_input_typed' as const,
          properties: {
            value: value,
            app: telemetryContext.app,
          },
          groups: {} as Record<string, string>, // Groups will be populated by the telemetry system
        }
        // Cast to unknown first, then to the expected type to bypass type checking
        // This is a workaround for the type mismatch between CommandInputTypedEvent and CommandMenuOpenedEvent
        telemetryContext.onTelemetry(
          event as unknown as Parameters<typeof telemetryContext.onTelemetry>[0]
        )
      }
    },
    [telemetryContext]
  )

  const debouncedLogTelemetry = useCallback(
    (value: string) => {
      // Only trigger telemetry if the user is adding characters (not removing with backspace)
      const isAddingCharacters = value.length > previousValueRef.current.length

      if (!isAddingCharacters) {
        previousValueRef.current = value
        return
      }

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      debounceTimeoutRef.current = setTimeout(() => {
        logTelemetryEvent(value)
        previousValueRef.current = value
      }, 500)
    },
    [logTelemetryEvent]
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  const handleValueChange = (value: string) => {
    setInputValue(value)
    debouncedLogTelemetry(value)
  }

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
      onValueChange={handleValueChange}
      placeholder="Run a command or search..."
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
