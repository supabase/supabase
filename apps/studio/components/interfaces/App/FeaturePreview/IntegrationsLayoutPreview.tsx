import Image from 'next/image'
import { BASE_PATH } from 'ui-patterns/CommandMenu/prepackaged/shared/constants'

export const IntegrationsLayoutPreview = () => (
  <div>
    <p className="text-sm text-foreground-light mb-4">
      Install Dashboard Integrations in a single click and try the new layout.
    </p>

    <Image
      alt="integrations layout preview"
      src={`${BASE_PATH}/img/previews/integrations-layout-preview.png`}
      width={1296}
      height={900}
      className="rounded-sm border"
    />
  </div>
)
