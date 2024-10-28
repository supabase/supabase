import { Alert_Shadcn_, AlertDescription_Shadcn_, InfoIcon, WarningIcon } from 'ui'

interface FormMessageProps {
  message: string
  type: 'error' | 'success'
}

function FormMessage({ message, type }: FormMessageProps) {
  return (
    <Alert_Shadcn_ variant={type === 'error' ? 'destructive' : 'default'} className="mt-2">
      {type === 'error' ? <WarningIcon /> : <InfoIcon className="h-4 w-4" />}
      <AlertDescription_Shadcn_>{message}</AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

export default FormMessage
