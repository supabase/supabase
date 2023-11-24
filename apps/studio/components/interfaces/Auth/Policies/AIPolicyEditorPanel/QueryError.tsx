import { QueryResponseError } from 'data/sql/execute-sql-mutation'
import { AiIcon, AlertTitle_Shadcn_, Alert_Shadcn_, Button, IconAlertCircle } from 'ui'

const QueryError = ({
  error,
  onSelectDebug,
}: {
  error: QueryResponseError
  onSelectDebug: () => void
}) => {
  const formattedError =
    (error?.formattedError?.split('\n') ?? [])?.filter((x: string) => x.length > 0) ?? []

  return (
    <div className="flex flex-col gap-y-3">
      <Alert_Shadcn_
        variant="warning"
        className="flex items-center [&>svg]:relative [&>svg]:left-0 [&>svg]:top-0"
      >
        <IconAlertCircle strokeWidth={2} />
        <AlertTitle_Shadcn_ className="m-0 !pl-4">Error running SQL query</AlertTitle_Shadcn_>
        <div className="ml-auto">
          <Button
            type="warning"
            className="hover:bg-transparent group"
            icon={<AiIcon className="scale-75 [&>div>div]:border-amber-900" />}
            onClick={() => onSelectDebug()}
          >
            Debug
          </Button>
        </div>
      </Alert_Shadcn_>
      <div className="overflow-x-auto">
        {formattedError.length > 0 ? (
          formattedError.map((x: string, i: number) => (
            <pre key={`error-${i}`} className="font-mono text-sm">
              {x}
            </pre>
          ))
        ) : (
          <p className="font-mono text-sm">{error.error}</p>
        )}
      </div>
    </div>
  )
}

export default QueryError
