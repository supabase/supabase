// [Joshen] Chuck this into the UI library with proper positioning logic via radix
// and proper width derivation using useRef. Unable to pass a ref to the Input component
//
// For now a couple of things are a bit hacky like width derivation, z-index, selection of suggestion
// with timeouts and a lot of unnecessary defensive guards - but these can go away when we port
// the component over to the UI library

import * as Tooltip from '@radix-ui/react-tooltip'
import { noop } from 'lodash'
import { useEffect, useRef, useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconList,
  Input,
} from 'ui'

import type { Suggestion } from './ColumnEditor.types'

const MAX_SUGGESTIONS = 3

interface InputWithSuggestionsProps {
  label?: string
  description?: string
  placeholder?: string
  size?: 'small' | 'tiny' | 'medium' | 'large'
  layout?: 'horizontal' | 'vertical'
  disabled?: boolean
  className?: string
  value: string
  suggestions: Suggestion[]
  suggestionsTooltip?: string
  suggestionsHeader?: string
  onChange: (event: any) => void
  onSelectSuggestion: (suggestion: Suggestion) => void
  'data-testid'?: string
}

const InputWithSuggestions = ({
  label,
  description,
  placeholder,
  size,
  layout,
  disabled = false,
  className = '',
  value = '',
  suggestions = [],
  suggestionsTooltip,
  suggestionsHeader,
  onChange = noop,
  onSelectSuggestion = noop,
  'data-testid': dataTestId,
}: InputWithSuggestionsProps) => {
  const ref = useRef(null)
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>(suggestions)
  const showSuggestions = filteredSuggestions.length > 0

  useEffect(() => {
    setFilteredSuggestions(suggestions.slice(0, MAX_SUGGESTIONS))
  }, [suggestions])

  const onInputChange = (event: any) => {
    onChange(event)

    const inputText = event.target.value

    if (suggestions.length > MAX_SUGGESTIONS) {
      const filteredSuggestions = inputText
        ? suggestions.filter((suggestion: Suggestion) => {
            return suggestion.name.indexOf(inputText) !== -1
          })
        : suggestions
      setFilteredSuggestions(filteredSuggestions.slice(0, MAX_SUGGESTIONS))
    }
  }

  return (
    <div ref={ref} className="relative">
      <Input
        label={label}
        descriptionText={description}
        placeholder={placeholder}
        size={size}
        layout={layout}
        disabled={disabled}
        className={className}
        inputClassName="pr-10"
        type="text"
        value={value}
        onChange={onInputChange}
        data-testid={dataTestId}
        actions={
          showSuggestions && (
            <DropdownMenu>
              <Tooltip.Root delayDuration={0}>
                <DropdownMenuTrigger asChild>
                  <Tooltip.Trigger asChild>
                    <Button type="default" className="!px-1 mr-0.5">
                      <IconList strokeWidth={1.5} size={14} />
                    </Button>
                  </Tooltip.Trigger>
                </DropdownMenuTrigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'bg-alternative rounded py-1 px-2 leading-none shadow',
                        'border-background border',
                      ].join(' ')}
                    >
                      <span className="text-foreground text-xs">
                        {suggestionsTooltip || 'Suggestions'}
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>

              <DropdownMenuContent align="end" side="bottom">
                <DropdownMenuLabel>{suggestionsHeader || 'Suggestions'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filteredSuggestions.map((suggestion: Suggestion) => (
                  <DropdownMenuItem
                    className="space-x-2"
                    key={suggestion.name}
                    onClick={() => onSelectSuggestion(suggestion)}
                  >
                    <div>{suggestion.name}</div>
                    <div className="text-foreground-lighter">{suggestion.description}</div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      />
    </div>
  )
}

export default InputWithSuggestions
