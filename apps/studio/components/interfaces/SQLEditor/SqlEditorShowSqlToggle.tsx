import { Code } from 'lucide-react'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

export interface SqlEditorShowSqlToggleProps {
  isSqlEditorVisible: boolean
  onToggle: () => void
}

export const SqlEditorShowSqlToggle = ({
  isSqlEditorVisible,
  onToggle,
}: SqlEditorShowSqlToggleProps) => (
  <ButtonTooltip
    type="text"
    className="px-1.5 opacity-70 hover:opacity-100"
    icon={<Code size={14} strokeWidth={1.5} />}
    onClick={onToggle}
    tooltip={{
      content: {
        side: 'bottom',
        text: isSqlEditorVisible ? 'Hide SQL' : 'Show SQL',
      },
    }}
  />
)
