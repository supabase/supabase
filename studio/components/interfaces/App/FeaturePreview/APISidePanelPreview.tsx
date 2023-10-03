const APISidePanelPreview = () => {
  return (
    <div className="space-y-2">
      <p className="text-foreground-light text-sm">
        Get building with your client application faster with your Project's API documentation now
        available on any page across the dashboard. Get contextualized code snippets based on what
        you're viewing in the dashboard - so less thinking, more building.
      </p>
      <img
        src="/img/previews/api-docs-preview.png"
        alt="api-docs-side-panel-preview"
        className="rounded border"
      />
      <div className="space-y-2 !mt-4">
        <p className="text-sm">
          Enabling this preview will involve the following changes to the UI:
        </p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>
            The original API documentation page will be replaced by a global API documentation side
            panel that can be accessed anywhere while in a project. (Still via the left navigation
            bar)
          </li>
          <li>
            Documentation for storage, edge functions, and realtime have been added to the API
            documentation side panel.
          </li>
          <li>
            Opening the API documentation side panel via the "API" button on the Table Editor, Auth
            Users Management, Storage Explorer, and Edge Functions pages will directly open docs for
            the resource that you're looking at
          </li>
          <li>
            For e.g. Opening the docs while in the Storage Explorer will show docs for the bucket
            that you're currently viewing
          </li>
          <li>
            All code snippets are also contextualized to the page that you're on in the dashboard.
          </li>
        </ul>
      </div>
    </div>
  )
}

export default APISidePanelPreview
