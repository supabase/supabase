import { useState, type ComponentProps } from 'react'
import { cn, Textarea } from 'ui'

type CommaSeparatedListInputProps = Omit<ComponentProps<typeof Textarea>, 'value'> & {
  value: string
}

// Shows one item per line while the field is read-only, and the original
// comma-separated string while it is being edited. The value is never rewritten.
export const CommaSeparatedListInput = ({
  value,
  readOnly,
  className,
  onFocus,
  onBlur,
  ...props
}: CommaSeparatedListInputProps) => {
  const [isFocused, setIsFocused] = useState(false)
  const isEditing = isFocused && !readOnly
  const items = value.split(',')

  return (
    <Textarea
      {...props}
      value={isEditing ? value : items.join('\n')}
      readOnly={!isEditing}
      rows={Math.max(items.length, 4)}
      className={cn('resize-none', className)}
      onFocus={(event) => {
        setIsFocused(true)
        onFocus?.(event)
      }}
      onBlur={(event) => {
        setIsFocused(false)
        onBlur?.(event)
      }}
    />
  )
}
