// [Joshen] Chuck this into the UI library with proper positioning logic via radix
// and proper width derivation using useRef. Unable to pass a ref to the Input component
//
// For now a couple of things are a bit hacky like width derivation, z-index, selection of suggestion
// with timeouts and a lot of unnecessary defensive guards - but these can go away when we port
// the component over to the UI library

import { FC, useEffect, useRef, useState } from 'react'
import { Input, Typography } from '@supabase/ui'
import { Suggestion } from './ColumnEditor.types'
import { timeout } from 'lib/helpers'

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
  suggestionsHeader = 'Suggestions',
  suggestionsWidth,
  suggestions = [],
  onChange = () => {},
  onSelectSuggestion = () => {},
}) => {
  const ref = useRef(null)
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [derviedSuggestionsWidth, setDerivedSuggestionsWidth] =
    useState<number>(DEFAULT_SUGGESTIONS_WIDTH)
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>(suggestions)
  const showSuggestions = isFocused && filteredSuggestions.length > 0

  useEffect(() => {
    // This is super hacky but will go away when we bring it into the UI library
    // It's mainly cause I can't pass a ref into Input
    const parentInputFieldWidth = (ref?.current as any).children[0]?.children[0]?.children[
      layout === 'horizontal' ? 1 : 0
    ]?.offsetWidth
    const width = suggestionsWidth || parentInputFieldWidth || DEFAULT_SUGGESTIONS_WIDTH
    setDerivedSuggestionsWidth(width)
  }, [ref.current])

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
        type="text"
        value={value}
        onFocus={() => setIsFocused(true)}
        onBlur={async () => {
          await timeout(100)
          setIsFocused(false)
        }}
        onChange={onInputChange}
      />
      {showSuggestions && (
        <div
          className="z-10 absolute top-11 right-0"
          style={{ width: `calc(${derviedSuggestionsWidth}px)` }}
        >
          <div className="bg-gray-800 border border-gray-600 shadow rounded-md py-1">
            <p className="px-4">
              <Typography.Text small className="opacity-50">
                {suggestionsHeader}
              </Typography.Text>
            </p>
            <div className="flex flex-col mt-2">
              {filteredSuggestions.map((suggestion: Suggestion) => (
                <div
                  key={suggestion.name}
                  className="px-4 py-2 cursor-pointer flex grid grid-cols-12 gap-2 hover:bg-green-600 !bg-opacity-40"
                  onClick={() => onSelectSuggestion(suggestion)}
                >
                  <div className="col-span-6">
                    <Typography.Text>{suggestion.name}</Typography.Text>
                  </div>
                  <div className="col-span-6">
                    <Typography.Text small className="opacity-50">
                      {suggestion.description}
                    </Typography.Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InputWithSuggestions
