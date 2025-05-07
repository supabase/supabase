import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { BASE_PATH } from 'lib/constants'
import { ExternalLink, X } from 'lucide-react'
import Image from 'next/image'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, Badge, Button } from 'ui'
import { useIsNewLayoutEnabled } from './FeaturePreviewContext'
import { LOCAL_STORAGE_KEYS } from 'common'

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

export const LayoutUpdateBanner = () => {
  const newLayoutPreview = useIsNewLayoutEnabled()
  const [newLayoutPreviewState] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.UI_NEW_LAYOUT_PREVIEW, '')
  const [newLayoutAcknowledged, setNewLayoutAcknowledged] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.NEW_LAYOUT_NOTICE_ACKNOWLEDGED,
    false
  )
  const isDefaultOptedInNewLayout = newLayoutPreview && newLayoutPreviewState === ''

  if (!isDefaultOptedInNewLayout || newLayoutAcknowledged) return null

  return (
    <Alert_Shadcn_ className="mb-4 relative">
      <AlertTitle_Shadcn_>
        <Badge variant="brand" className="mr-2">
          NEW
        </Badge>
        Dashboard layout has been updated!
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        We've updated the dashboard layout to make it easier to find and manage your organization
        settings.
      </AlertDescription_Shadcn_>
      <AlertDescription_Shadcn_ className="mt-4 flex items-center gap-x-2">
        <Button asChild type="default" icon={<ExternalLink />}>
          <a
            target="_blank"
            rel="noreferrer noopener"
            href="https://github.com/orgs/supabase/discussions/33670"
          >
            View announcement
          </a>
        </Button>
      </AlertDescription_Shadcn_>
      <ButtonTooltip
        type="text"
        icon={<X />}
        className="absolute top-2 right-2 px-1"
        onClick={() => setNewLayoutAcknowledged(true)}
        tooltip={{ content: { side: 'bottom', text: 'Dismiss' } }}
      />
    </Alert_Shadcn_>
  )
}
