import { BASE_PATH } from 'lib/constants'
import Image from 'next/image'

export const TableEditorTabsPreview = () => {
  return (
    <div className="space-y-2">
      <p className="text-foreground-light text-sm mb-4">
        Your project's API documentation will be available on any page across the dashboard. <br />
        Get contextualized code snippets based on what you're viewing in the dashboard. Less
        thinking, more building.
      </p>
      <Image
        src={`${BASE_PATH}/img/previews/tabs-editor.png`}
        width={1860}
        height={970}
        alt="api-docs-side-panel-preview"
        className="rounded border"
      />
    </div>
  )
}
