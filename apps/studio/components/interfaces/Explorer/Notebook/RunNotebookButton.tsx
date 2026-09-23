import { Play } from 'lucide-react'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

interface RunNotebookButtonProps {
  isRunning: boolean
  disabled?: boolean
  className?: string
  onClick: () => void
}

export const RunNotebookButton = ({
  isRunning,
  disabled,
  className,
  onClick,
}: RunNotebookButtonProps) => (
  <ButtonTooltip
    type="button"
    variant="default"
    size="tiny"
    className={className}
    aria-label="Run notebook"
    icon={<Play size={16} strokeWidth={2} />}
    tooltip={{ content: { side: 'bottom', text: 'Run notebook' } }}
    loading={isRunning}
    disabled={disabled}
    onClick={onClick}
  >
    Run
  </ButtonTooltip>
)
