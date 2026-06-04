import { Search, X } from 'lucide-react'
import { Button } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

import { onSearchInputEscape } from '@/lib/keyboard'

interface FilterInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export const FilterInput = ({ value, onChange, placeholder, className }: FilterInputProps) => {
  return (
    <Input
      size="tiny"
      autoComplete="off"
      icon={<Search />}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onSearchInputEscape(value, onChange)}
      name="keyword"
      id="keyword"
      placeholder={placeholder || 'Filter by query'}
      className={className || 'w-56'}
      actions={[
        value && (
          <Button
            key="clear"
            size="tiny"
            type="text"
            icon={<X />}
            onClick={() => onChange('')}
            className="p-0 h-5 w-5"
          />
        ),
      ]}
    />
  )
}
