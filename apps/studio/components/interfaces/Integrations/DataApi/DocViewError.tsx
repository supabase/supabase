interface DocViewErrorProps {
  error: Error | null
}

export const DocViewError = ({ error }: DocViewErrorProps) => {
  return (
    <div className="p-6 mx-auto text-center sm:w-full md:w-3/4">
      <div className="text-foreground-light">
        <p>Error connecting to API</p>
        <p>{error?.message ?? 'An unexpected error occurred'}</p>
      </div>
    </div>
  )
}
