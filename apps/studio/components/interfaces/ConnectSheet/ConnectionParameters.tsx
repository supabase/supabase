import CopyButton from '@/components/ui/CopyButton'

interface Parameter {
  key: string
  value: string
}

interface ConnectionParametersProps {
  parameters: Parameter[]
  onCopy?: (paramKey: string) => void
}

export const ConnectionParameters = ({ parameters, onCopy }: ConnectionParametersProps) => {
  const copyAllText = parameters.map((param) => `${param.key}=${param.value}`).join('\n')

  return (
    <div className="overflow-hidden rounded-lg border bg-surface-75">
      <div className="flex items-center justify-between border-b bg-surface-100 py-2 pl-4 pr-2">
        <span className="text-xs text-foreground-light">Connection parameters</span>
        <CopyButton
          variant="default"
          size="tiny"
          copyLabel="Copy all"
          text={copyAllText}
          aria-label="Copy all connection parameters"
          onClick={() => onCopy?.('all')}
        />
      </div>
      <div className="divide-y">
        {parameters.map((param) => (
          <div
            key={param.key}
            className="flex items-center gap-x-2 py-2.5 pl-4 pr-2 font-mono text-sm"
          >
            <span className="shrink-0 text-foreground-lighter">{param.key}:</span>
            <span className="flex-1 truncate text-foreground" title={param.value}>
              {param.value}
            </span>
            <CopyButton
              variant="default"
              size="tiny"
              iconOnly
              text={param.value}
              aria-label={`Copy ${param.key}`}
              onClick={() => onCopy?.(param.key)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
