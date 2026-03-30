import { ErrorDisplay } from 'ui-patterns/ErrorDisplay/ErrorDisplay'

export default function ErrorDisplayWithChildren() {
  return (
    <ErrorDisplay
      title="Failed to load tables"
      errorMessage="ERROR: FAILED TO RUN SQL QUERY: CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT."
      supportFormParams={{ projectRef: 'my-project' }}
    >
      <div className="px-4 py-3 text-sm text-foreground-light border-b border-default">
        Troubleshooting steps would appear here — e.g. a{' '}
        <code className="font-mono text-xs">TroubleshootingAccordion</code>.
      </div>
    </ErrorDisplay>
  )
}
