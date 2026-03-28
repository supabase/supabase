import { ErrorDisplay } from 'ui-patterns/ErrorDisplay/ErrorDisplay'

export default function ErrorDisplayDemo() {
  return (
    <ErrorDisplay
      title="Failed to load tables"
      errorMessage="ERROR: FAILED TO RUN SQL QUERY: CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT."
      supportFormParams={{ projectRef: 'my-project' }}
    />
  )
}
