import { Button, Toggle } from 'ui'
import { Hook } from './hooks.constants'

interface HookCardProps {
  hook: Hook
  canUpdateConfig: boolean
  onToggle: (enabled: boolean) => void
  onSelect: () => void
  onDelete: () => void
}

export const HookCard = ({
  hook,
  canUpdateConfig,
  onToggle,
  onSelect,
  onDelete,
}: HookCardProps) => {
  return (
    <div className="bg-surface-100 border-default overflow-hidden border shadow px-5 py-4 flex flex-row">
      <div className="flex flex-col flex-0 overflow-y-auto w-full">
        <span className="text-sm text-foreground">{hook.title}</span>
        <span className="text-sm text-foreground-light">{hook.subtitle}</span>
        <div className="text-sm flex flex-row space-x-5 py-4">
          {hook.method.type === 'postgres' ? (
            <>
              <div className="flex flex-col">
                <span className="text-foreground-light">schema</span>
                <span className="text-foreground-light">function</span>
              </div>
              <div className="flex flex-col overflow-y-auto">
                <span title={hook.method.schema}>{hook.method.schema}</span>
                <span title={hook.method.functionName}>{hook.method.functionName}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col">
                <span className="text-foreground-light">endpoint</span>
                <span className="text-foreground-light">secret</span>
              </div>
              <div className="flex flex-col overflow-y-auto">
                <span title={hook.method.url}>{hook.method.url}</span>
                <span className="truncate" title={hook.method.secret}>
                  {hook.method.secret}
                </span>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-row gap-2">
          <Button type="default" disabled={!canUpdateConfig} onClick={() => onSelect()}>
            Configure hook
          </Button>
          <Button type="danger" disabled={!canUpdateConfig} onClick={() => onDelete()}>
            Delete hook
          </Button>
        </div>
      </div>
      <div className="p-4 flex-1">
        <Toggle
          checked={hook.enabled}
          disabled={!canUpdateConfig}
          onChange={() => onToggle(!hook.enabled)}
        />
      </div>
    </div>
  )
}
