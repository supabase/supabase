// [Joshen] Chuck this into the UI library with proper positioning logic via radix
// and proper width derivation using useRef. Unable to pass a ref to the Input component
//
// For now a couple of things are a bit hacky like width derivation, z-index, selection of suggestion
// with timeouts and a lot of unnecessary defensive guards - but these can go away when we port
// the component over to the UI library

import { noop } from 'lodash'
import { List } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import type { Suggestion } from './ColumnEditor.types'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

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
  'aria-label'?: string
}

const InputWithSuggestions = ({
  className,
  label,
  description,
  placeholder,
  size,
  layout,
  disabled = false,
  value = '',
  suggestions = [],
  suggestionsTooltip,
  suggestionsHeader,
  onChange = noop,
  onSelectSuggestion = noop,
  'data-testid': dataTestId,
  'aria-label': ariaLabel,
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
      <FormItemLayout layout={layout} label={label} description={description} isReactForm={false}>
        <InputGroup>
          <InputGroupInput
            className={className}
            aria-label={ariaLabel}
            data-testid={dataTestId}
            disabled={disabled}
            size={size}
            value={value}
            title={value}
            onChange={onInputChange}
            placeholder={placeholder}
          />
          {showSuggestions && (
            <InputGroupAddon align="inline-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <ButtonTooltip
                    type="text"
                    size="tiny"
                    tooltip={{
                      content: { text: suggestionsTooltip || 'Suggestions', side: 'bottom' },
                    }}
                  >
                    <List strokeWidth={1.5} size={14} />
                  </ButtonTooltip>
                </DropdownMenuTrigger>

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
            </InputGroupAddon>
          )}
        </InputGroup>
      </FormItemLayout>
    </div>
  )
}

export default InputWithSuggestions
