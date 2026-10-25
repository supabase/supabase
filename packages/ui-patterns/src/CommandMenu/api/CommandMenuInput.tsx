'use client'

import { useBreakpoint, useDebounce } from 'common'
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import type React from 'react'
import { cn, CommandInput } from 'ui'

import { useCurrentPage, usePopPage } from './hooks/pagesHooks'
import { useQuery, useSetQuery } from './hooks/queryHooks'
import { useCommandMenuTelemetryContext } from './hooks/useCommandMenuTelemetryContext'

const INPUT_TYPED_EVENT_DEBOUNCE_TIME = 2000 // 2s

function useFocusInputOnWiderScreens(ref: React.ForwardedRef<HTMLInputElement>) {
  const isBelowSm = useBreakpoint('sm')
  const isBelowSmSynchronous = useRef(isBelowSm)
  isBelowSmSynchronous.current = isBelowSm

  const internalRef = useRef<HTMLInputElement | null>(null)
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

const CommandMenuInput = forwardRef<
  React.ElementRef<typeof CommandInput>,
  React.ComponentPropsWithoutRef<typeof CommandInput>
>(
  (
    {
      className,
      wrapperClassName,
      onKeyDown,
      value: propValue,
      onValueChange: propOnValueChange,
      ...props
    },
    ref
  ) => {
    const inputRef = useFocusInputOnWiderScreens(ref)

    const page = useCurrentPage()
    const popPage = usePopPage()

    const query = useQuery()
    const setQuery = useSetQuery()

    const isControlled = propValue !== undefined
    const [inputValue, setInputValue] = useState(propValue ?? query)

    useEffect(() => {
      if (isControlled) {
        setInputValue(propValue)
        previousValueRef.current = propValue
      } else {
        setInputValue(query)
        previousValueRef.current = query
      }
    }, [isControlled, propValue, query])

    const currentValue = isControlled ? propValue : inputValue

    // Get telemetry context
    const telemetryContext = useCommandMenuTelemetryContext()
    const previousValueRef = useRef<string>(currentValue)

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
        inputTelemetryEvent(currentValue)
        previousValueRef.current = currentValue
      }, [inputTelemetryEvent, currentValue]),
      INPUT_TYPED_EVENT_DEBOUNCE_TIME
    )

    const handleValueChange = useCallback(
      (value: string) => {
        if (!isControlled) {
          setInputValue(value)
        }
        propOnValueChange?.(value)

        // Only trigger telemetry if the user is adding characters (not removing with backspace)
        const isAddingCharacters = value.length > previousValueRef.current.length

        if (!isAddingCharacters) {
          previousValueRef.current = value
          return
        }

        // Trigger debounced telemetry
        debouncedTelemetry()
      },
      [debouncedTelemetry, isControlled, propOnValueChange]
    )

    // To handle CJK input
    const [imeComposing, setImeComposing] = useState(false)
    useEffect(() => {
      if (!imeComposing) {
        setQuery(currentValue)
      }
    }, [currentValue, imeComposing, setQuery])

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event)
      if (event.defaultPrevented) return

      // Backspace on an empty input steps back to the previous page
      if (event.key === 'Backspace' && !currentValue && !imeComposing && page) {
        event.preventDefault()
        popPage()
      }
    }

    return (
      <div className="relative w-full" cmdk-input-wrapper="">
        <CommandInput
          // Focus needs to be manually handled to check breakpoint first, due to
          // delays from useEffect
          autoFocus={false}
          ref={inputRef}
          value={currentValue}
          onValueChange={handleValueChange}
          onKeyDown={handleKeyDown}
          placeholder="Run a command or search..."
          onCompositionStart={() => setImeComposing(true)}
          onCompositionEnd={() => setImeComposing(false)}
          wrapperClassName={cn('px-4', wrapperClassName)}
          className={cn(
            'flex h-11 w-full rounded-md bg-transparent px-2 y-4 md:py-7 outline-hidden',
            'focus:shadow-none focus:ring-transparent',
            'text-sm text-foreground-light placeholder:text-foreground-muted disabled:cursor-not-allowed disabled:opacity-50 border-0',
            className
          )}
          {...props}
        />
      </div>
    )
  }
)

CommandMenuInput.displayName = 'CommandMenuInput'

export { CommandMenuInput }
