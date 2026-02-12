interface DocViewErrorProps {
  error: Error | null
}

export const DocViewError = ({ error }: DocViewErrorProps) => {
  return (
    <div className="p-6 mx-auto text-center sm:w-full md:w-3/4">
      <p className="text-foreground-light">
        <p>Error connecting to API</p>
        <p>{`${error}`}</p>
      </p>
    </div>
  )
}
