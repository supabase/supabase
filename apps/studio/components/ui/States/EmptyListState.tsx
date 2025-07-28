const EmptyListState = ({ title, description }: { title: string; description: string }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center">
      <div className="flex flex-col gap-1">
        <div className="relative flex h-4 w-32 items-center justify-center rounded border border-dashed px-2" />
        <div className="relative flex h-4 w-32 items-center justify-center rounded border border-dashed px-2" />
      </div>
      <div className="flex flex-col gap-1 px-5">
        <h3 className="text-foreground text-sm">{title}</h3>
        <p className="text-foreground-lighter text-sm">{description}</p>
      </div>
    </div>
  )
}

export { EmptyListState }
