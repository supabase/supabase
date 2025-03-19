import { BASE_PATH } from 'lib/constants'
import Image from 'next/image'

export const SqlEditorTabsPreview = () => {
  return (
    <div className="space-y-2">
      <Image
        src={`${BASE_PATH}/img/previews/tabs-sql.png`}
        width={1860}
        height={970}
        alt="api-docs-side-panel-preview"
        className="rounded border"
      />
      <p className="text-foreground-light text-sm">
        The SQL Editor now features tabs for improved navigation and organization. Conveniently go
        between the queries that you're focused on, and collapse the sidebar for a bigger real
        estate while writing your queries.
      </p>
      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>Enable opening of queries in the SQL Editor as tabs</li>
          <li>Support closing of the navigation sidebar for a larger code editor space</li>
        </ul>
      </div>
    </div>
  )
}
