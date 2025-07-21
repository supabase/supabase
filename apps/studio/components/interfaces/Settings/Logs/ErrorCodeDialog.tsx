import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Badge,
  Button_Shadcn_,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'ui'
import { useErrorCodesQuery } from 'data/content-api/docs-error-codes-query'
import { type ErrorCodeQueryQuery, Service } from 'data/graphql/graphql'
import { AlertTriangle } from 'lucide-react'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

interface ErrorCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  errorCode: string
  service?: Service
}

export const ErrorCodeDialog = ({
  open,
  onOpenChange,
  errorCode,
  service,
}: ErrorCodeDialogProps) => {
  const { data, isLoading, isSuccess, refetch } = useErrorCodesQuery(
    { code: errorCode, service },
    { enabled: open }
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="mb-4">
            Help for error code <code>{errorCode}</code>
          </DialogTitle>
          <DialogDescription>
            {isLoading && <LoadingState />}
            {isSuccess && <SuccessState data={data} />}
            {!isLoading && !isSuccess && <ErrorState refetch={refetch} />}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

const LoadingState = () => (
  <>
    <ShimmeringLoader className="w-3/4 mb-2" />
    <ShimmeringLoader className="w-1/2" />
  </>
)

const SuccessState = ({ data }: { data: ErrorCodeQueryQuery | undefined }) => {
  const errors = data?.errors?.nodes?.filter((error) => !!error.message)
  if (!errors || errors.length === 0) {
    return <>No information found for this error code.</>
  }

  return (
    <>
      <p className="mb-4">Possible explanations for this error:</p>
      <div className="grid gap-2 grid-cols-[max-content_1fr]">
        {errors.map((error) => (
          <ErrorExplanation key={`${error.service}-${error.code}`} {...error} />
        ))}
      </div>
    </>
  )
}

const ErrorExplanation = ({
  code,
  service,
  message,
}: {
  code: string
  service: Service
  message?: string | null
}) => {
  if (!message) return null

  return (
    <>
      <Badge className="h-fit">{service}</Badge>
      <p>{message}</p>
    </>
  )
}

const ErrorState = ({ refetch }: { refetch?: () => void }) => (
  <Alert_Shadcn_ variant="warning">
    <AlertTriangle />
    <AlertTitle_Shadcn_>Lookup failed</AlertTitle_Shadcn_>
    <AlertDescription_Shadcn_>
      <p>Failed to look up error code help info</p>
      {refetch && (
        <Button_Shadcn_ variant="outline" size="sm" className="mt-2" onClick={refetch}>
          Try again
        </Button_Shadcn_>
      )}
    </AlertDescription_Shadcn_>
  </Alert_Shadcn_>
)
