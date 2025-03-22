import { BASE_PATH } from 'lib/constants'
import Image from 'next/image'

export const TableEditorTabsPreview = () => {
  return (
    <div className="space-y-2">
      <Image
        src={`${BASE_PATH}/img/previews/tabs-editor.png`}
        width={1860}
        height={970}
        alt="api-docs-side-panel-preview"
        className="rounded border"
      />
      <p className="text-foreground-light text-sm">
        The Table Editor now features tabs for improved navigation and organization. Have multiple
        tables opened across schemas and conveniently go across them without having to switch
        schemas. Collapse the sidebar for a bigger real estate while browsing your data.
      </p>
      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>Enable opening of tables in the Table Editor as tabs</li>
          <li>Support closing of the navigation sidebar for a larger data grid space</li>
        </ul>
      </div>
    </div>
  )
}
