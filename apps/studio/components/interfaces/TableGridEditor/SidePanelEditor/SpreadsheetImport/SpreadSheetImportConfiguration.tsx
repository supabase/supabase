import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { Button, Checkbox_Shadcn_, cn, Collapsible, Label_Shadcn_, SidePanel } from 'ui'
import type { SpreadsheetData } from './SpreadsheetImport.types'

interface SpreadSheetImportConfigurationProps {
  spreadsheetData: SpreadsheetData
  selectedHeaders: string[]
  onToggleHeader: (header: string) => void
  treatEmptyAsNull: boolean
  onToggleTreatEmptyAsNull: () => void
}

const SpreadsheetImportConfiguration = ({
  spreadsheetData,
  selectedHeaders,
  onToggleHeader,
  treatEmptyAsNull,
  onToggleTreatEmptyAsNull,
}: SpreadSheetImportConfigurationProps) => {
  const [expandConfiguration, setExpandConfiguration] = useState(false)

  return (
    <Collapsible open={expandConfiguration} onOpenChange={setExpandConfiguration} className={''}>
      <Collapsible.Trigger asChild>
        <SidePanel.Content>
          <div className="py-1 flex items-center justify-between">
            <p className="text-sm">Configure import data</p>
            <Button
              type="text"
              icon={
                <ChevronDown
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
      </Collapsible.Trigger>
      <Collapsible.Content>
        <SidePanel.Content>
          <div className="py-2 space-y-3">
            <div>
              <p className="text-sm text-foreground-light">Select which columns to import</p>
              <p className="text-sm text-foreground-light">
                By default, all columns are selected to be imported from your CSV
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox_Shadcn_
                id="treat-empty-as-null"
                checked={treatEmptyAsNull}
                onCheckedChange={onToggleTreatEmptyAsNull}
              />
              <Label_Shadcn_ htmlFor="treat-empty-as-null" className="text-sm text-foreground-light cursor-pointer">
                Treat empty cells as <code className="text-xs">NULL</code>
              </Label_Shadcn_>
            </div>
            <div className="flex items-center flex-wrap gap-2 pl-0.5 pb-0.5">
              {spreadsheetData.headers.map((header) => {
                const isSelected = selectedHeaders.includes(header)
                return (
                  <Button
                    key={header}
                    type={isSelected ? 'primary' : 'default'}
                    className={cn('transition', isSelected ? 'opacity-100' : 'opacity-75')}
                    onClick={() => onToggleHeader(header)}
                  >
                    {header}
                  </Button>
                )
              })}
            </div>
          </div>
        </SidePanel.Content>
      </Collapsible.Content>
    </Collapsible>
  )
}

export default SpreadsheetImportConfiguration
