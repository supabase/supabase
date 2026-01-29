import { BASE_PATH } from 'lib/constants'
import { Box, Cable, Database, Sparkles } from 'lucide-react'
import { useTheme } from 'next-themes'
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
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import { ClientSelectDropdown, MCP_CLIENTS } from 'ui-patterns/McpUrlBuilder'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'

import { FrameworkSelector } from '../HomeNew/GettingStarted/FrameworkSelector'
import { FRAMEWORKS, MOBILES } from './Connect.constants'
import type { ConnectMode, FieldOption, ResolvedField } from './Connect.types'
import { ConnectionIcon } from './ConnectionIcon'

// Icon mapping for modes
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
  const { resolvedTheme } = useTheme()
  const formLayoutClassName =
    'md:gap-8 md:[&>div:first-child]:!w-[calc(50%-16px)] md:[&_[data-formlayout-id=labelContainer]]:!w-[calc(50%-16px)]'

  if (activeFields.length === 0) return null

  // Get all frameworks for the combobox
  const allFrameworks = [...FRAMEWORKS, ...MOBILES]

  return (
    <div className="space-y-6">
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
            // For framework field, use the combobox selector
            if (field.id === 'framework') {
              return (
                <FormLayout
                  key={field.id}
                  layout="flex-row-reverse"
                  label={field.label}
                  description="What is your preferred coding agent"
                  className={formLayoutClassName}
                >
                  <FrameworkSelector
                    value={String(value ?? '')}
                    onChange={(v) => onFieldChange(field.id, v)}
                    items={allFrameworks}
                    className="w-full"
                    size="small"
                  />
                </FormLayout>
              )
            }

            // Default radio-grid behavior for other fields
            return (
              <FormLayout
                key={field.id}
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
              </FormLayout>
            )

          case 'radio-list':
            return (
              <FormLayout
                key={field.id}
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
              </FormLayout>
            )

          case 'select':
            // Special case for MCP client - use the custom dropdown
            if (field.id === 'mcpClient') {
              const selectedClient = MCP_CLIENTS.find((c) => c.key === value) ?? MCP_CLIENTS[0]
              return (
                <FormLayout
                  key={field.id}
                  layout="flex-row-reverse"
                  label={field.label}
                  description={field.description}
                  className={formLayoutClassName}
                >
                  <ClientSelectDropdown
                    basePath={BASE_PATH}
                    theme={(resolvedTheme ?? 'dark') as 'light' | 'dark'}
                    label=""
                    className="w-full"
                    clients={MCP_CLIENTS}
                    selectedClient={selectedClient}
                    onClientChange={(v) => onFieldChange(field.id, v)}
                  />
                </FormLayout>
              )
            }

            return (
              <FormLayout
                key={field.id}
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
              </FormLayout>
            )

          case 'switch':
            return (
              <FormLayout
                key={field.id}
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
              </FormLayout>
            )

          case 'multi-select':
            return (
              <FormLayout
                key={field.id}
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
              </FormLayout>
            )

          default:
            return null
        }
      })}
    </div>
  )
}

// ============================================================================
// Mode Selector
// ============================================================================

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
