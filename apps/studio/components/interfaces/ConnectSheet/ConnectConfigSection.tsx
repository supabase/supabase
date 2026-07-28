import {
  cn,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

import type { ConnectMode, FieldOption, ResolvedField } from './Connect.types'
import { ConnectionIcon } from './ConnectionIcon'
import {
  ConnectModeButton,
  getConnectModeButtonCornerVariants,
  getConnectModeEmptySlotClasses,
} from './ConnectModeButton'

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
                layout="horizontal"
                label={field.label}
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
                        {option.icon && <ConnectionIcon supportsDarkMode icon={option.icon} />}
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
                layout="horizontal"
                label={field.label}
              >
                <RadioGroupStacked
                  value={String(value ?? '')}
                  onValueChange={(v) => onFieldChange(field.id, v)}
                  className="min-w-0 w-full"
                >
                  {options.map((option) => (
                    <RadioGroupStackedItem
                      key={option.value}
                      id={`connect-${field.id}-${option.value}`}
                      value={option.value}
                      className="min-w-0 w-full text-left"
                      label={
                        <span className="flex min-w-0 items-center gap-2">
                          {option.icon && <ConnectionIcon icon={option.icon} />}
                          <span className="truncate">{option.label}</span>
                        </span>
                      }
                      description={option.description}
                    />
                  ))}
                </RadioGroupStacked>
              </FormItemLayout>
            )

          case 'select':
            return (
              <FormItemLayout
                key={field.id}
                isReactForm={false}
                layout="horizontal"
                label={field.label}
                description={field.description}
              >
                <Select
                  value={String(value ?? '')}
                  onValueChange={(v) => onFieldChange(field.id, v)}
                >
                  <SelectTrigger
                    size="small"
                    className="[&>span:first-child]:flex [&>span:first-child]:items-center [&>span:first-child]:gap-x-2"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="[&>span:last-child]:flex [&>span:last-child]:items-center [&>span:last-child]:gap-x-2"
                      >
                        {/*
                          [Joshen] Omitting MCP icons for now as the images are not optimized (large)
                          and is causing noticeably latency issues on the browser (even with the existing Connect UI)
                         */}
                        {field.id === 'framework' && option.icon && (
                          <ConnectionIcon icon={option.icon} />
                        )}
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItemLayout>
            )

          case 'switch':
            return (
              <FormItemLayout
                key={field.id}
                isReactForm={false}
                layout="horizontal"
                label={field.label}
                description={field.description}
                className="[&>div>label>span]:break-keep! [&>div>label>span]:text-balance"
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
                layout="horizontal"
                label={field.label}
                description={field.description}
              >
                <MultiSelector
                  values={Array.isArray(value) ? value : []}
                  onValuesChange={(v) => onFieldChange(field.id, v)}
                >
                  <MultiSelectorTrigger
                    className="w-full"
                    label="Select features"
                    badgeLimit="wrap"
                    showIcon={true}
                  />
                  <MultiSelectorContent>
                    <MultiSelectorList>
                      {options.map((option) => (
                        <MultiSelectorItem
                          key={option.value}
                          value={option.value}
                          className="items-start"
                        >
                          <div className="flex flex-col ml-2 gap-y-0.5">
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

interface ModeSelectorProps {
  modes: Array<{ id: ConnectMode; label: string; description: string }>
  selected: ConnectMode
  onChange: (mode: ConnectMode) => void
}

export function ModeSelector({ modes, selected, onChange }: ModeSelectorProps) {
  const count = modes.length
  // 2-col layout leaves an empty cell when count is odd; hide it once we switch to a single row
  const emptySlots = count % 2 === 1 ? 1 : 0

  return (
    // Container query: 2-col when the sheet is narrow; one equal row when there's room
    <div className="@container">
      <div
        className={cn(
          'grid',
          'grid-cols-2',
          count === 3 && '@[28rem]:grid-cols-3',
          count === 4 && '@[30rem]:grid-cols-4',
          count === 5 && '@[32rem]:grid-cols-5',
          count >= 6 && '@[36rem]:grid-cols-6'
        )}
      >
        {modes.map((mode, index) => (
          <ConnectModeButton
            key={mode.id}
            modeId={mode.id}
            label={mode.label}
            description={mode.description}
            selected={selected === mode.id}
            onClick={() => onChange(mode.id)}
            {...getConnectModeButtonCornerVariants({ index, count, emptySlots })}
          />
        ))}

        {Array.from({ length: emptySlots }, (_, index) => (
          <div
            key={`empty-${index}`}
            aria-hidden
            className={getConnectModeEmptySlotClasses(count)}
          />
        ))}
      </div>
    </div>
  )
}
