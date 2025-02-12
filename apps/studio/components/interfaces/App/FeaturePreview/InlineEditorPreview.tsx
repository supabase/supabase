import { BASE_PATH } from 'lib/constants'
import Image from 'next/image'

const InlineEditorPreview = () => {
  return (
    <div>
      <Image
        src={`${BASE_PATH}/img/previews/inline-editor-preview.png`}
        width={1296}
        height={900}
        alt="api-docs-side-panel-preview"
        className="rounded border mb-4"
      />
      <p className="text-sm text-foreground-light mb-2">
        The inline editor allows you to quickly edit SQL queries directly in the interface without
        opening a new tab or window. This feature streamlines your workflow by providing immediate
        access to query editing capabilities wherever you see SQL code.
      </p>
      <p className="text-sm text-foreground-light">
        You can access the inline editor by clicking the code editor icon in the top right corner of
        your dashboard.
      </p>
    </div>
  )
}

export default InlineEditorPreview
