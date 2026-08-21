export const MissingLimitErrorRenderer = () => (
  <div className="flex flex-col items-center justify-center gap-2 text-center h-full px-5">
    <h3 className="text-lg text-foreground">Add a LIMIT to your query</h3>
    <p className="text-sm max-w-sm text-foreground-lighter">
      Queries must include a LIMIT clause to avoid scanning large amounts of data. Add a LIMIT (for
      example, <span className="font-mono">LIMIT 100</span>) and run the query again.
    </p>
  </div>
)
