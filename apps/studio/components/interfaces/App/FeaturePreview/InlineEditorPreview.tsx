import Image from 'next/image'

import { BASE_PATH } from 'lib/constants'
import { Admonition } from 'ui-patterns'

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
      <p className="text-sm text-foreground-light">
        Access an inline SQL editor where you can write and run queries wherever you are in the
        dashboard. Use the inline Assistant to generate or modify queries without leaving the
        editor.
      </p>
      <Admonition type="note" className="my-4">
        With the inline editor enabled, editing policies, triggers and database functions will all
        be done using the editor.
      </Admonition>
      <p className="text-sm text-foreground-light">
        You can access the inline editor by clicking the code editor icon in the top right corner of
        your dashboard.
      </p>
    </div>
  )
}

export default InlineEditorPreview
