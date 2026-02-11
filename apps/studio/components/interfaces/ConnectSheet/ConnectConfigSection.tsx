import {
  RadioGroupStacked,
  RadioGroupStackedItem,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'

import type { FieldOption, ResolvedField } from './Connect.types'
import { ConnectionIcon } from './ConnectionIcon'

interface ConnectConfigSectionProps {
  activeFields: ResolvedField[]
  state: Record<string, string | boolean | string[]>
  onFieldChange: (fieldId: string, value: string | boolean | string[]) => void
  getFieldOptions: (fieldId: string) => FieldOption[]
}

export function ConnectConfigSection({
  activeFields,
  state,
  onFieldChange,
  getFieldOptions,
}: ConnectConfigSectionProps) {
  if (activeFields.length === 0) return null

  const formLayoutClassName = 'md:[&>div:first-child]:!w-1/3 xl:[&>div:first-child]:!w-2/5'

  return (
    <div className="flex flex-col gap-y-4">
      {activeFields.map((field) => {
        const options = getFieldOptions(field.id)
        const value = state[field.id]

        // Skip fields with no options (or single option that's auto-selected)
        // Exception: switch and multi-select fields don't require options
        if (field.type !== 'switch' && field.type !== 'multi-select') {
          if (options.length === 0) return null
          if (options.length === 1) return null
        }

        switch (field.type) {
          case 'radio-grid':
            return (
              <FormItemLayout
                key={field.id}
                isReactForm={false}
                layout="flex-row-reverse"
                label={field.label}
                className={formLayoutClassName}
              >
                <RadioGroupStacked
                  value={String(value ?? '')}
                  onValueChange={(v) => onFieldChange(field.id, v)}
                  className="flex-row gap-3 space-y-0"
                >
                  {options.map((option) => (
                    <RadioGroupStackedItem
                      key={option.value}
                      id={`connect-${field.id}-${option.value}`}
                      value={option.value}
                      label=""
                      className="flex-1 rounded-lg text-left"
                    >
                      <div className="flex items-center gap-2">
                        {option.icon && <ConnectionIcon icon={option.icon} />}
                        <span className="text-sm">{option.label}</span>
                      </div>
                    </RadioGroupStackedItem>
                  ))}
                </RadioGroupStacked>
              </FormItemLayout>
            )

          case 'radio-list':
            return (
              <FormItemLayout
                key={field.id}
                isReactForm={false}
                layout="flex-row-reverse"
                label={field.label}
                className={formLayoutClassName}
              >
                <RadioGroupStacked
                  value={String(value ?? '')}
                  onValueChange={(v) => onFieldChange(field.id, v)}
                >
                  {options.map((option) => (
                    <RadioGroupStackedItem
                      key={option.value}
                      id={`connect-${field.id}-${option.value}`}
                      value={option.value}
                      label=""
                      className="w-full text-left"
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          {option.icon && <ConnectionIcon icon={option.icon} />}
                          <span className="text-sm">{option.label}</span>
                        </div>
                        {option.description && (
                          <span className="text-sm text-foreground-lighter">
                            {option.description}
                          </span>
                        )}
                      </div>
                    </RadioGroupStackedItem>
                  ))}
                </RadioGroupStacked>
              </FormItemLayout>
            )

          case 'select':
            return (
              <FormItemLayout
                key={field.id}
                isReactForm={false}
                layout="flex-row-reverse"
                label={field.label}
                description={field.description}
                className={formLayoutClassName}
              >
                <Select_Shadcn_
                  value={String(value ?? '')}
                  onValueChange={(v) => onFieldChange(field.id, v)}
                >
                  <SelectTrigger_Shadcn_ size="small" className="w-full">
                    <SelectValue_Shadcn_ />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {options.map((option) => (
                      <SelectItem_Shadcn_ key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </FormItemLayout>
            )

          case 'switch':
            return (
              <FormItemLayout
                key={field.id}
                isReactForm={false}
                layout="flex-row-reverse"
                label={field.label}
                description={field.description}
                className={formLayoutClassName}
              >
                <Switch
                  id={field.id}
                  checked={Boolean(value)}
                  onCheckedChange={(v) => onFieldChange(field.id, v)}
                />
              </FormItemLayout>
            )

          case 'multi-select':
            return (
              <FormItemLayout
                key={field.id}
                isReactForm={false}
                layout="flex-row-reverse"
                label={field.label}
                description={field.description}
                className={formLayoutClassName}
              >
                <MultiSelector
                  values={Array.isArray(value) ? value : []}
                  onValuesChange={(v) => onFieldChange(field.id, v)}
                >
                  <MultiSelectorTrigger
                    className="w-full"
                    label="All features except Storage enabled by default"
                    badgeLimit="wrap"
                    showIcon={true}
                  />
                  <MultiSelectorContent>
                    <MultiSelectorList>
                      {options.map((option) => (
                        <MultiSelectorItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            {option.description && (
                              <span className="text-xs text-foreground-light">
                                {option.description}
                              </span>
                            )}
                          </div>
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </FormItemLayout>
            )

          default:
            return null
        }
      })}
    </div>
  )
}
