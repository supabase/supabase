// [Joshen] Chuck this into the UI library with proper positioning logic via radix
// and proper width derivation using useRef. Unable to pass a ref to the Input component
//
// For now a couple of things are a bit hacky like width derivation, z-index, selection of suggestion
// with timeouts and a lot of unnecessary defensive guards - but these can go away when we port
// the component over to the UI library

import { FC, useEffect, useRef, useState } from 'react'
import { Button, Dropdown, IconList, Input } from '@supabase/ui'
import { Suggestion } from './ColumnEditor.types'

const MAX_SUGGESTIONS = 3
const DEFAULT_SUGGESTIONS_WIDTH = 400

interface Props {
  label?: string
  description?: string
  placeholder?: string
  size?: 'small' | 'tiny' | 'medium' | 'large'
  layout?: 'horizontal' | 'vertical'
  disabled?: boolean
  className?: string
  value: string
  format?: string
  suggestionsHeader?: string
  suggestionsWidth?: number
  suggestions: Suggestion[]
  onChange: (event: any) => void
  onSelectSuggestion: (suggestion: Suggestion) => void
}

const InputWithSuggestions: FC<Props> = ({
  label,
  description,
  placeholder,
  size,
  layout,
  disabled = false,
  className = '',
  value = '',
  format,
  suggestions = [],
  onChange = () => {},
  onSelectSuggestion = () => {},
}) => {
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
        className={`${className} ${format?.includes('json') ? 'input-mono' : ''}`}
        type="text"
        value={value}
        onChange={onInputChange}
        actions={
          showSuggestions && (
            <Dropdown
              size={'medium'}
              align="end"
              side="bottom"
              overlay={
                <>
                  <Dropdown.Label>Suggestions</Dropdown.Label>
                  <Dropdown.Seperator />
                  {filteredSuggestions.map((suggestion: Suggestion) => (
                    <Dropdown.Item
                      key={suggestion.name}
                      onClick={() => onSelectSuggestion(suggestion)}
                    >
                      <div className="text-sm">{suggestion.name}</div>
                      <div className="text-scale-900 text-xs">{suggestion.description}</div>
                    </Dropdown.Item>
                  ))}
                </>
              }
            >
              <Button as="span" type="default" icon={<IconList strokeWidth={1.5} />}></Button>
            </Dropdown>
          )
        }
      />
    </div>
  )
}

export default InputWithSuggestions
