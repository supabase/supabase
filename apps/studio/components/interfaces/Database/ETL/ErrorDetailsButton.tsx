import { AlertCircle } from 'lucide-react'
import { Button, Popover_Shadcn_, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_ } from 'ui'

interface ErrorDetailsButtonProps {
  reason: string
  solution?: string
}

/**
 * Parses error reason to extract user-friendly message and technical details.
 * Supports common error formats like "message: details" or "ERROR: details"
 */
const parseErrorMessage = (
  reason: string
): { userMessage: string; technicalDetails: string } => {
  // Try to split on common patterns
  const colonIndex = reason.indexOf(':')

  if (colonIndex === -1) {
    // No colon found, treat entire message as user message
    return {
      userMessage: reason.trim(),
      technicalDetails: reason.trim(),
    }
  }

  // Extract the part before the first colon as potential prefix
  const prefix = reason.substring(0, colonIndex).trim()
  const rest = reason.substring(colonIndex + 1).trim()

  // Common error prefixes that indicate technical details follow
  const technicalPrefixes = ['ERROR', 'FATAL', 'WARN', 'WARNING', 'EXCEPTION', 'PANIC']
  const isTechnicalPrefix = technicalPrefixes.some(
    (p) => prefix.toUpperCase() === p || prefix.toUpperCase().startsWith(p + ' ')
  )

  if (isTechnicalPrefix) {
    // For technical prefixes, try to extract a more user-friendly message
    // Look for the first sentence or up to 100 chars
    const sentenceEnd = rest.search(/[.!?]\s/)
    if (sentenceEnd !== -1 && sentenceEnd < 100) {
      return {
        userMessage: rest.substring(0, sentenceEnd + 1).trim(),
        technicalDetails: reason.trim(),
      }
    }
    // If no sentence boundary or too long, take first 100 chars
    if (rest.length > 100) {
      return {
        userMessage: rest.substring(0, 100).trim() + '...',
        technicalDetails: reason.trim(),
      }
    }
    return {
      userMessage: rest,
      technicalDetails: reason.trim(),
    }
  }

  // For non-technical prefixes, the prefix might be a category or context
  // Use it as the user message and full text as technical details
  return {
    userMessage: prefix,
    technicalDetails: reason.trim(),
  }
}

export const ErrorDetailsButton = ({ reason, solution }: ErrorDetailsButtonProps) => {
  const { userMessage, technicalDetails } = parseErrorMessage(reason)

  return (
    <Popover_Shadcn_>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          size="tiny"
          type="default"
          className="w-min"
          icon={<AlertCircle />}
          aria-label="Show error details"
        >
          Show Error
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        className="w-[500px] max-w-[90vw]"
        align="start"
        side="bottom"
      >
        <div className="flex flex-col gap-y-4">
          {/* User-friendly error message */}
          <div>
            <h4 className="text-sm font-medium mb-2">Error Summary</h4>
            <p className="text-xs text-foreground-light">{userMessage}</p>
          </div>

          {/* Solution if available */}
          {solution && (
            <div>
              <h4 className="text-sm font-medium mb-2">Suggested Solution</h4>
              <p className="text-xs text-foreground-light">{solution}</p>
            </div>
          )}

          {/* Technical details */}
          <div>
            <h4 className="text-sm font-medium mb-2">Technical Details</h4>
            <div className="bg-surface-100 rounded-md p-3 overflow-x-auto">
              <pre className="text-xs font-mono text-foreground-light whitespace-pre-wrap break-words">
                {technicalDetails}
              </pre>
            </div>
          </div>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
