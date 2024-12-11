import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import { BASE_PATH } from 'lib/constants'
import Image from 'next/image'

export const SqlEditorTabsPreview = () => {
  const { ref } = useParams()

  return (
    <div className="space-y-2">
      <Markdown
        className="text-foreground-light"
        content={`The SQL Editor now features tabs for improved navigation and organization.`}
      />
      <Image
        src={`${BASE_PATH}/img/previews/api-docs-preview.png`}
        width={1860}
        height={970}
        alt="api-docs-side-panel-preview"
        className="rounded border"
      />
    </div>
  )
}
