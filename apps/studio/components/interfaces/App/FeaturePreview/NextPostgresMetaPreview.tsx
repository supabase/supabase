export const NextPostgresMetaPreview = () => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground-light">
        Route this project&apos;s dashboard database metadata requests through the next-generation
        Postgres Meta service (ex_pg_meta) instead of the current postgres-meta backend.
      </p>
      <div className="space-y-2">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>Use ex_pg_meta for table, schema, and SQL editor metadata calls on this project</li>
          <li>Apply to all dashboard users on this project once enabled</li>
        </ul>
      </div>
      <p className="text-sm text-foreground-light">
        This is a beta preview. Disable it anytime to return to the current postgres-meta backend.
      </p>
    </div>
  )
}
