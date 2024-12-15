import { Markdown } from 'components/interfaces/Markdown'
import { BASE_PATH } from 'lib/constants'
import Image from 'next/image'

export const SqlEditorTabsPreview = () => {
  return (
    <div className="space-y-2">
      <p className="text-foreground-light text-sm mb-4">
        The SQL Editor now features tabs for improved navigation and organization.
      </p>
      <Image
        src={`${BASE_PATH}/img/previews/tabs-sql.png`}
        width={1860}
        height={970}
        alt="api-docs-side-panel-preview"
        className="rounded border"
      />
    </div>
  )
}
