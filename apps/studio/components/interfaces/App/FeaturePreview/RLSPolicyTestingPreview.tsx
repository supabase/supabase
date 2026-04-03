export const RLSPolicyTestingPreview = () => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-foreground-light text-sm mb-4">
        Test your Row Level Security policies locally before applying them. Uses an in-browser
        Postgres instance (PGlite) to simulate policy behavior with your actual table schema and
        sample data — nothing leaves your machine.
      </p>
      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>Add a "Testing" tab to the Auth &gt; Policies page</li>
          <li>
            Allow you to write a CREATE POLICY statement and test it against configurable roles
            (anon, authenticated with custom uid/email)
          </li>
          <li>
            Load a subset of your table data into an in-browser Postgres for local, isolated
            testing
          </li>
          <li>
            Show a results matrix indicating which operations (SELECT, INSERT, UPDATE, DELETE)
            each role can perform
          </li>
          <li>Provide a one-click "Apply as Migration" to promote tested policies</li>
        </ul>
      </div>
    </div>
  )
}
