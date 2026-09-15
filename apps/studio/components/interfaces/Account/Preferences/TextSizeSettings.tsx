import { CardContent, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { useTextSize } from '@/hooks/misc/useTextSize'
import { applyTextSize, parseTextSize, TEXT_SIZE_OPTIONS } from '@/lib/text-size'

export const TextSizeSettings = () => {
  const { textSize, setTextSize } = useTextSize()
  return (
    <CardContent>
      <FormItemLayout
        isReactForm={false}
        label="Text size"
        layout="flex-row-reverse"
        description="Adjust the size of interface text without changing layout density."
      >
        <Select
          value={textSize}
          onValueChange={(next) => {
            const value = parseTextSize(next)
            applyTextSize(document.documentElement, value)
            setTextSize(value)
          }}
        >
          <SelectTrigger aria-label="Text size">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEXT_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormItemLayout>
    </CardContent>
  )
}
