const NavigationV2Preview = () => {
  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground-light">
        Try the new three-column navigation layout. This replaces the current two-level sidebar
        (primary + secondary product menu) with a single unified sidebar that organizes pages into
        collapsible groups: Database, Platform, Observability, and Integrations.
      </p>
      <div className="space-y-2 text-sm text-foreground-light">
        <p className="text-foreground font-medium">What changes:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Unified sidebar</strong> - All navigation is in one collapsible sidebar instead
            of a primary nav + secondary product menu.
          </li>
          <li>
            <strong>Database group</strong> - Table Editor, SQL Editor, Schema Visualizer, Backups,
            Migrations, and Replication are all top-level items in the Database section.
          </li>
          <li>
            <strong>Collapsible platform pages</strong> - Auth, Storage, Edge Functions, and
            Realtime are collapsible items with their sub-pages nested inside.
          </li>
          <li>
            <strong>Right icon rail</strong> - Quick access to AI, SQL, Alerts, and Help panels on
            the right side.
          </li>
          <li>
            <strong>No project header bar</strong> - Project and organization context is displayed
            in the sidebar header.
          </li>
        </ul>
      </div>
    </div>
  )
}

export { NavigationV2Preview }
