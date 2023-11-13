const EmptyListState = ({ title, description }: { title: string; description: string }) => {
  return (
    <div
      className="
        flex flex-col
        items-center
        justify-center 
        gap-6
        text-center
    "
    >
      <div className="flex flex-col gap-1">
        <div className="relative flex h-4 w-32 items-center rounded border border-dashed px-2"></div>
        <div className="relative flex h-4 w-32 items-center rounded border border-dashed px-2">
          <div className="absolute right-1 -bottom-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1 px-5">
        <h3 className="text-foreground text-sm">{title}</h3>
        <p className="text-foreground-lighter text-sm">{description}</p>
      </div>
    </div>
  )
}

export { EmptyListState }
