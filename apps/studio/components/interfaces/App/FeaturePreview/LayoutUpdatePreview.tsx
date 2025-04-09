import { BASE_PATH } from 'lib/constants'
import Image from 'next/image'

export const LayoutUpdatePreview = () => {
  return (
    <div className="space-y-2">
      <Image
        src={`${BASE_PATH}/img/previews/layout-update.png`}
        width={1860}
        height={970}
        alt="api-docs-side-panel-preview"
        className="rounded border"
      />
      <p className="text-foreground-light text-sm">
        The layout out of the dashboard is now scoped to the organization that you're currently on
        instead of all organizations that you are a member of, in hopes to provide a clearer
        navigation to your organization settings.
      </p>
      <p className="text-foreground-light text-sm">
        This feature preview only updates the layout for the home page, organization settings pages,
        and account pages. Layout for project pages will not have any changes.
      </p>
      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>
            Display only the projects from the organization you are currently viewing on the home
            page
          </li>
          <li>Update homepage sidebar links to go directly to the settings for the organization</li>
          <li>
            Access to account preferences, access tokens, security settings, and audit logs are
            available via the user dropdown in the top navigation bar
          </li>
        </ul>
      </div>
    </div>
  )
}
