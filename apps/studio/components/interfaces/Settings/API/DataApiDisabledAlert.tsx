import { Alert, AlertDescription, AlertTitle, WarningIcon } from 'ui'

export const DataApiDisabledAlert = () => {
  return (
    <Alert variant="warning">
      <WarningIcon />
      <AlertTitle>No schemas can be queried</AlertTitle>
      <AlertDescription>
        <p>
          With this setting disabled, you will not be able to query any schemas via the Data API.
        </p>
        <p>
          You will see errors from the Postgrest endpoint{' '}
          <code className="text-code-inline">/rest/v1/</code>.
        </p>
      </AlertDescription>
    </Alert>
  )
}
