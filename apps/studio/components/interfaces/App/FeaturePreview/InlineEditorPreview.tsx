import Image from 'next/image'

import { BASE_PATH } from 'lib/constants'

export const InlineEditorPreview = () => {
  return (
    <div>
      <Image
        src={`${BASE_PATH}/img/previews/inline-editor-preview.png`}
        width={1296}
        height={900}
        alt="api-docs-side-panel-preview"
        className="rounded border mb-4"
      />
      <p className="text-sm text-foreground-light mb-4">
        Edit policies, functions, and triggers directly in the inline SQL editor. When you select
        any of these database objects, the editor opens automatically, allowing you to make changes
        without switching contexts.
      </p>
      <p className="text-sm text-foreground-light mb-4">
        Need help writing SQL? Use the inline Assistant to generate or modify code for your
        policies, triggers, and functions without leaving the editor.
      </p>
      <p className="text-sm text-foreground-light">
        Access the inline editor anytime by clicking the code editor icon in the top right corner of
        your dashboard.
      </p>
    </div>
  )
}
