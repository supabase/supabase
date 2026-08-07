import { Admonition } from 'ui-patterns/Admonition'

import { InlineLinkClassName } from '@/components/ui/InlineLink'

// Temporary warning: scoped tokens can't be used with the Supabase MCP server yet.
// Tracked by Linear DESIGN-479, blocked on the AI-1025 FGA guard migration.
// Remove once that lands: delete this module, then the two call sites (NewScopedTokenFormReview, ViewTokenSheet).

export const MCP_UNSUPPORTED_WARNING_TITLE =
  "Scoped tokens don't currently work with the Supabase MCP server"
export const MCP_UNSUPPORTED_WARNING_DESCRIPTION = 'Support for scoped tokens is coming soon.'

interface McpUnsupportedWarningProps {
  onSelectLegacyToken?: () => void
}

export const McpUnsupportedWarning = ({ onSelectLegacyToken }: McpUnsupportedWarningProps) => (
  <Admonition
    type="warning"
    title={MCP_UNSUPPORTED_WARNING_TITLE}
    description={
      onSelectLegacyToken ? (
        <p>
          {MCP_UNSUPPORTED_WARNING_DESCRIPTION} If you need a full-access token for the MCP server,{' '}
          <button
            type="button"
            className={InlineLinkClassName}
            onClick={onSelectLegacyToken}
            tabIndex={0}
          >
            create a legacy token
          </button>
          .
        </p>
      ) : (
        MCP_UNSUPPORTED_WARNING_DESCRIPTION
      )
    }
  />
)
