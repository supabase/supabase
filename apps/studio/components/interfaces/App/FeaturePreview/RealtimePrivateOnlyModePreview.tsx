import Image from 'next/image'

import { BASE_PATH } from 'lib/constants'

export const RealtimePrivateOnlyModePreview = () => {
  return (
    <div>
      <Image
        src={`${BASE_PATH}/img/previews/inline-editor-preview.png`}
        width={1296}
        height={900}
        alt="api-docs-side-panel-preview"
        className="rounded border mb-4"
      />
      <p className="text-sm text-foreground-light mb-4"></p>
    </div>
  )
}
