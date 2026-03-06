import { Box, Cable, Database, Sparkles } from 'lucide-react'
import {
  cn,
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

import type { ConnectMode, FieldOption, ResolvedField } from './Connect.types'
import { ConnectionIcon } from './ConnectionIcon'

const MODE_ICONS: Record<string, React.ReactNode> = {
  framework: <Box size={16} strokeWidth={1.5} />,
  direct: <Database size={16} strokeWidth={1.5} />,
  orm: <Cable size={16} strokeWidth={1.5} />,
  mcp: <Sparkles size={16} strokeWidth={1.5} />,
}

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
                layout="horizontal"
                label={field.label}
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
                layout="horizontal"
                label={field.label}
                description={field.description}
              >
                <Select_Shadcn_
                  value={String(value ?? '')}
                  onValueChange={(v) => onFieldChange(field.id, v)}
                >
                  <SelectTrigger_Shadcn_
                    size="small"
                    className="[&>span:first-child]:flex [&>span:first-child]:items-center [&>span:first-child]:gap-x-2"
                  >
                    <SelectValue_Shadcn_ />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {options.map((option) => (
                      <SelectItem_Shadcn_
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
                layout="horizontal"
                label={field.label}
                description={field.description}
                className="[&>div>label>span]:!break-keep [&>div>label>span]:text-balance"
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
                    label="All features except Storage enabled by default"
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
  return (
    <div className="grid grid-cols-4 rounded-lg border">
      {modes.map((mode) => (
        <button
          key={mode.id}
          type="button"
          onClick={() => onChange(mode.id)}
          className={cn(
            'flex flex-col items-center gap-2 p-4 transition-colors border-r last:border-r-0',
            selected === mode.id
              ? 'bg-surface-200'
              : 'border-default hover:border-strong hover:bg-surface-100 '
          )}
        >
          <span className="text-foreground-light">{MODE_ICONS[mode.id]}</span>
          <div>
            <p className="heading-default text-center">{mode.label}</p>
            <p className="text-sm text-foreground-lighter text-center">{mode.description}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
