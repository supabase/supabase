import CopyButton from '@/components/ui/CopyButton'

interface WorkerCommandLineProps {
  command: string
  comment?: string
}

export const WorkerCommandLine = ({ command, comment }: WorkerCommandLineProps) => (
  <div className="space-y-1">
    {comment && <p className="font-mono text-xs text-foreground-lighter">{`> ${comment}`}</p>}
    <div className="flex items-center gap-2 font-mono text-sm text-foreground">
      <span className="text-foreground-lighter">$</span>
      <span className="flex-1">{command}</span>
      <CopyButton
        text={command}
        iconOnly
        variant="text"
        aria-label="Copy command"
        className="text-foreground-lighter hover:text-foreground"
      />
    </div>
  </div>
)
