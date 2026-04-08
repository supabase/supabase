import Image from 'next/image'

import { BASE_PATH } from '@/lib/constants'

const NavigationV2Preview = () => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground-light">
        Try the updated Studio navigation: organization and project selectors live in the sidebar
        along with a prominent Connect button, the main column stays focused on your work, and a
        slim toolbar on the right keeps right-panel tools one click away — while the top bar stays
        cleaner.
      </p>
      <Image
        src={`${BASE_PATH}/img/previews/nav-v2-preview.png`}
        width={1296}
        height={900}
        quality={100}
        alt="new-studio-navigation-preview"
        className="rounded border"
      />
      <div className="space-y-2 text-sm text-foreground-light">
        <p className="text-foreground font-medium">What changes:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Unified organization, project, and branch selectors</strong> — Pick your
            organization, project, and branch next to Connect at the top of the sidebar instead of
            the more space-consuming breadcrumb trail in the top bar.
          </li>
          <li>
            <strong>Cohesive sidebar layout</strong> — Primary navigation reads as one continuous
            column so core pages are easier to scan and jump between.
          </li>
          <li>
            <strong>Right panel toolbar</strong> — A vertical icon rail on the right edge opens
            panels for SQL, advisors, help, and other utilities without crowding the top bar.
          </li>
          <li>
            <strong>Cleaner top navbar</strong> — The header keeps global actions like search,
            feedback, and your account. Leaving precious space for important callouts.
          </li>
        </ul>
      </div>
    </div>
  )
}

export { NavigationV2Preview }
