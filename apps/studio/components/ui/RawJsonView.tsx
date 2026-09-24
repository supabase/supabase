import { FloatingPlate } from 'ui'

import { JsonCodeBlock } from './JsonCodeBlock'
import CopyButton from '@/components/ui/CopyButton'

interface RawJsonViewProps {
  data: unknown
  /** Accessible name for the copy button, e.g. "Copy log as JSON". */
  copyLabel: string
}

/** Full-bleed JSON for a side panel tab, with a copy button pinned while scrolling. */
export function RawJsonView({ data, copyLabel }: RawJsonViewProps) {
  const json = JSON.stringify(data, null, 2)

  return (
    <>
      <div className="pointer-events-none sticky top-2 z-10 -mb-9 flex justify-end px-2">
        <FloatingPlate className="pointer-events-auto">
          <CopyButton iconOnly aria-label={copyLabel} variant="default" text={json} />
        </FloatingPlate>
      </div>
      <JsonCodeBlock>{json}</JsonCodeBlock>
    </>
  )
}
