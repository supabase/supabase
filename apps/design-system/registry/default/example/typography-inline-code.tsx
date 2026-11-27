export default function TypographyInlineCode() {
  return (
    <div className="w-full min-w-0 space-y-6 text-sm">
      <p>
        Install <code>@supabase/supabase-js</code> to connect to your project.
      </p>
      <p>
        Read about{' '}
        <a className="underline" href="https://supabase.com/docs/reference/javascript/select">
          <code>select()</code>
        </a>
        .
      </p>
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="pb-2 font-medium">Column</th>
            <th className="pb-2 font-medium">Type</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>project_id</code>
            </td>
            <td>
              <code>uuid</code>
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Long tokens wrap:{' '}
        <code>
          https://your-project.supabase.co/rest/v1/project_settings?select=notification_preferences
        </code>
      </p>
      <p>
        Local size override: <code className="text-sm">project_id</code>
      </p>
      <div data-code-style="plain" className="rounded-md border bg-surface-100 p-4">
        <code className="text-xs text-foreground-light">Content-Type: application/json</code>
      </div>
    </div>
  )
}
