import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { TEMPLATE_FLOW_MODE_OPTIONS, type TemplateFlowMode } from './EmailTemplates.flowVariants'

interface TemplateFlowPickerProps {
  value: TemplateFlowMode
  onValueChange: (mode: TemplateFlowMode) => void
}

export const TemplateFlowPicker = ({ value, onValueChange }: TemplateFlowPickerProps) => {
  const selectedOption = TEMPLATE_FLOW_MODE_OPTIONS.find((option) => option.value === value)

  return (
    <FormItemLayout
      isReactForm={false}
      layout="vertical"
      label="Confirmation"
      description={selectedOption?.helperText}
    >
      <Select
        value={value}
        onValueChange={(nextValue) => onValueChange(nextValue as TemplateFlowMode)}
      >
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TEMPLATE_FLOW_MODE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormItemLayout>
  )
}
