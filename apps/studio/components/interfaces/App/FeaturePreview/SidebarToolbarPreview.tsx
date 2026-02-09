import { BASE_PATH } from 'lib/constants'
import Image from 'next/image'

export const SidebarToolbarPreview = () => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-foreground-light text-sm mb-4">
        Enable a dedicated vertical toolbar on the right side of the dashboard for a centralized
        access to side panels. This creates a consistent, repeatable pattern for opening panels
        while reducing clutter in the top navigation bar.
      </p>
      <Image
        src={`${BASE_PATH}/img/previews/sidebar-toolbar-preview.png`}
        width={1296}
        height={900}
        alt="sidebar-toolbar-preview"
        className="rounded border"
      />
      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>Add a dedicated sidebar toolbar on the right side of the dashboard</li>
          <li>
            Move the Help, Advisors, SQL Editor, and AI Assistant buttons from the top navigation
            bar to the new sidebar toolbar
          </li>
        </ul>
      </div>
    </div>
  )
}
