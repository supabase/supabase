import clsx from 'clsx'
import { useState } from 'react'
import { SidePanel, Button, IconChevronDown, Collapsible } from 'ui'
import { SpreadsheetData } from './SpreadsheetImport.types'

interface SpreadSheetImportConfigurationProps {
  spreadsheetData: SpreadsheetData
  selectedHeaders: string[]
  onToggleHeader: (header: string) => void
}

const SpreadsheetImportConfiguration = ({
  spreadsheetData,
  selectedHeaders,
  onToggleHeader,
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
                <IconChevronDown
                  size={18}
                  strokeWidth={2}
                  className={clsx('text-scale-1100', expandConfiguration && 'rotate-180')}
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
              <p className="text-sm text-scale-1100">Select which columns to import</p>
              <p className="text-sm text-scale-1000">
                By default, all columns are selected to be imported from your CSV
              </p>
            </div>
            <div className="flex items-center flex-wrap gap-2 pl-0.5 pb-0.5">
              {spreadsheetData.headers.map((header) => {
                const isSelected = selectedHeaders.includes(header)
                return (
                  <Button
                    key={header}
                    type={isSelected ? 'primary' : 'default'}
                    className={clsx('transition', isSelected ? 'opacity-100' : 'opacity-75')}
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
