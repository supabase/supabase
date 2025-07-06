import { Database } from 'lucide-react'

export interface PostgresEventMessageProps {
  message: string
  severity?: string
}

// Postgres Event Message Component
export const PostgresEventMessage = ({ message, severity }: PostgresEventMessageProps) => {
  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'error':
      case 'fatal':
        return 'border-destructive/20 bg-destructive/5 text-destructive'
      case 'warning':
        return 'border-warning/20 bg-warning/5 text-warning-foreground'
      case 'log':
        return 'border-border bg-surface-100 text-foreground'
      default:
        return 'border-border bg-surface-100 text-foreground'
    }
  }

  const getSeverityIcon = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'error':
      case 'fatal':
        return 'text-destructive'
      case 'warning':
        return 'text-warning'
      default:
        return 'text-foreground-light'
    }
  }

  // Enhanced message parsing for common postgres error patterns
  const parsePostgresMessage = (message: string) => {
    // Pattern: invalid input syntax for type <type>: "<value>"
    const invalidSyntaxMatch = message.match(/invalid input syntax for type (\w+): "([^"]+)"/i)
    if (invalidSyntaxMatch) {
      const [, type, value] = invalidSyntaxMatch
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium">Invalid Input Syntax</div>
          <div className="text-sm">
            Expected type:{' '}
            <code className="px-1 py-0.5 rounded bg-surface-200 text-foreground font-mono text-xs">
              {type}
            </code>
          </div>
          <div className="text-sm">
            Received value:{' '}
            <code className="px-1 py-0.5 rounded bg-surface-200 text-destructive font-mono text-xs">
              "{value}"
            </code>
          </div>
        </div>
      )
    }

    // Pattern: duplicate key value violates unique constraint
    const duplicateKeyMatch = message.match(
      /duplicate key value violates unique constraint "([^"]+)"/i
    )
    if (duplicateKeyMatch) {
      const [, constraint] = duplicateKeyMatch
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium">Unique Constraint Violation</div>
          <div className="text-sm">
            Constraint:{' '}
            <code className="px-1 py-0.5 rounded bg-surface-200 text-foreground font-mono text-xs">
              {constraint}
            </code>
          </div>
          <div className="text-xs text-foreground-light mt-1">
            A record with this value already exists
          </div>
        </div>
      )
    }

    // Pattern: relation "<table>" does not exist
    const relationMatch = message.match(/relation "([^"]+)" does not exist/i)
    if (relationMatch) {
      const [, relation] = relationMatch
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium">Relation Not Found</div>
          <div className="text-sm">
            Missing relation:{' '}
            <code className="px-1 py-0.5 rounded bg-surface-200 text-destructive font-mono text-xs">
              {relation}
            </code>
          </div>
          <div className="text-xs text-foreground-light mt-1">
            Table, view, or sequence does not exist
          </div>
        </div>
      )
    }

    // Pattern: column "<column>" does not exist
    const columnMatch = message.match(/column "([^"]+)" does not exist/i)
    if (columnMatch) {
      const [, column] = columnMatch
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium">Column Not Found</div>
          <div className="text-sm">
            Missing column:{' '}
            <code className="px-1 py-0.5 rounded bg-surface-200 text-destructive font-mono text-xs">
              {column}
            </code>
          </div>
        </div>
      )
    }

    // Pattern: permission denied for <object>
    const permissionMatch = message.match(/permission denied for (\w+) "?([^"]+)"?/i)
    if (permissionMatch) {
      const [, objectType, objectName] = permissionMatch
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium">Permission Denied</div>
          <div className="text-sm">
            {objectType}:{' '}
            <code className="px-1 py-0.5 rounded bg-surface-200 text-foreground font-mono text-xs">
              {objectName}
            </code>
          </div>
          <div className="text-xs text-foreground-light mt-1">User lacks required privileges</div>
        </div>
      )
    }

    // Connection/authentication messages
    if (message.includes('connection authorized')) {
      const parts = message.split(' ')
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium text-success">Connection Authorized</div>
          <div className="text-sm text-foreground-light">{message}</div>
        </div>
      )
    }

    // Default: show original message with basic formatting
    return (
      <div className="text-sm font-mono break-words whitespace-pre-wrap leading-relaxed">
        {message.length > 300 ? <span title={message}>{message.slice(0, 300)}...</span> : message}
      </div>
    )
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex items-center gap-2 mb-2">
        <Database size={14} className={getSeverityIcon(severity)} />
        <span className="text-xs font-medium text-foreground-light">
          Database Event
          {severity && (
            <span
              className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${getSeverityColor(severity)}`}
            >
              {severity.toUpperCase()}
            </span>
          )}
        </span>
      </div>
      <div className={`p-3 rounded-lg border ${getSeverityColor(severity)}`}>
        {parsePostgresMessage(message)}
      </div>
    </div>
  )
}
