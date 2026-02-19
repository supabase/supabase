import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, WarningIcon } from 'ui'

export const DataApiDisabledAlert = () => {
  return (
    <Alert_Shadcn_ variant="warning">
      <WarningIcon />
      <AlertTitle_Shadcn_>No schemas can be queried</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        <p>
          With this setting disabled, you will not be able to query any schemas via the Data API.
        </p>
        <p>
          You will see errors from the Postgrest endpoint{' '}
          <code className="text-code-inline">/rest/v1/</code>.
        </p>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
