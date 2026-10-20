import { ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'
import type { Control } from 'react-hook-form'
import {
  Button,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  FormControl,
  FormField,
  SidePanel,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { MultiSelector } from 'ui-patterns/multi-select'

import type { SpreadsheetData, SpreadsheetImportSettings } from './SpreadsheetImport.types'

interface SpreadSheetImportConfigurationProps {
  spreadsheetData: SpreadsheetData
  selectedHeaders: string[]
  onToggleHeader: (header: string) => void
  emptyStringAsNullHeaders: string[]
  onEmptyStringAsNullHeadersChange: (headers: string[]) => void
  control: Control<SpreadsheetImportSettings>
  canSkipConflictingRows: boolean
  isImporting: boolean
  onConfigurationChange: () => void
}

export const SpreadsheetImportConfiguration = ({
  spreadsheetData,
  selectedHeaders,
  onToggleHeader,
  emptyStringAsNullHeaders,
  onEmptyStringAsNullHeadersChange,
  control,
  canSkipConflictingRows,
  isImporting,
  onConfigurationChange,
}: SpreadSheetImportConfigurationProps) => {
  const [expandConfiguration, setExpandConfiguration] = useState(false)
  const importableHeaders = spreadsheetData.headers.filter((header) =>
    selectedHeaders.includes(header)
  )

  return (
    <Collapsible open={expandConfiguration} onOpenChange={setExpandConfiguration} className={''}>
      <CollapsibleTrigger asChild>
        <SidePanel.Content>
          <div className="py-1 flex items-center justify-between">
            <p className="text-sm">Configure import data</p>
            <Button
              variant="text"
              aria-label="Toggle import configuration"
              icon={
                <ChevronDownIcon
                  size={18}
                  strokeWidth={2}
                  className={cn('text-foreground-light', expandConfiguration && 'rotate-180')}
                />
              }
              className="px-1"
              onClick={() => setExpandConfiguration(!expandConfiguration)}
            />
          </div>
        </SidePanel.Content>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidePanel.Content>
          <div className="py-2 space-y-3">
            <div>
              <p className="text-sm text-foreground-light">Select which columns to import</p>
              <p className="text-sm text-foreground-light">
                By default, all columns are selected to be imported from your CSV
              </p>
            </div>
            <div className="flex items-center flex-wrap gap-2 pl-0.5 pb-0.5">
              {spreadsheetData.headers.map((header) => {
                const isSelected = selectedHeaders.includes(header)
                return (
                  <Button
                    key={header}
                    variant={isSelected ? 'primary' : 'default'}
                    aria-label={`Toggle column ${header}`}
                    aria-pressed={isSelected}
                    className={cn('transition', isSelected ? 'opacity-100' : 'opacity-75')}
                    onClick={() => onToggleHeader(header)}
                  >
                    {header}
                  </Button>
                )
              })}
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-foreground-light">Set empty cells as NULL</p>
                <p className="text-sm text-foreground-light">
                  Empty cells will only be converted to NULL for the selected imported columns
                </p>
              </div>
              <MultiSelector
                values={emptyStringAsNullHeaders}
                onValuesChange={onEmptyStringAsNullHeadersChange}
                disabled={importableHeaders.length === 0}
              >
                <MultiSelector.Trigger
                  badgeLimit="wrap"
                  label={
                    importableHeaders.length === 0
                      ? 'No imported columns selected'
                      : 'Select columns...'
                  }
                  mode="inline-combobox"
                />
                <MultiSelector.Content>
                  <MultiSelector.List>
                    {importableHeaders.map((header) => (
                      <MultiSelector.Item key={header} value={header}>
                        {header}
                      </MultiSelector.Item>
                    ))}
                  </MultiSelector.List>
                </MultiSelector.Content>
              </MultiSelector>
            </div>
            {canSkipConflictingRows && (
              <FormField
                control={control}
                name="skipConflictingRows"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex"
                    label="Skip conflicting rows"
                    description="Skip rows that violate primary key or unique constraints. Existing rows remain unchanged."
                  >
                    <FormControl>
                      <Switch
                        aria-label="Skip conflicting rows"
                        disabled={isImporting}
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          onConfigurationChange()
                        }}
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            )}
          </div>
        </SidePanel.Content>
      </CollapsibleContent>
    </Collapsible>
  )
}
