import { Admonition } from 'ui-patterns'

interface FormMessageProps {
  message: string
  type: 'error' | 'success'
}

function FormMessage({ message, type }: FormMessageProps) {
  return (
    <Admonition
      type={type === 'error' ? 'destructive' : 'default'}
      className="mt-2"
      title={message}
    />
  )
}

export default FormMessage
