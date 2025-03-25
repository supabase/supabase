type FormMessageProps = {
  message: string | null
}

export function FormMessage({ message }: FormMessageProps) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      {message && (
        <div className="text-foreground border-l-2 border-foreground px-4">{message}</div>
      )}
    </div>
  )
}
