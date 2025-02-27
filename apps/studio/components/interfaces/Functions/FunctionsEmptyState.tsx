import { ExternalLink } from 'lucide-react'

import { DocsButton } from 'components/ui/DocsButton'
import { Button } from 'ui'
import TerminalInstructions from './TerminalInstructions'

const FunctionsEmptyState = () => {
  return (
    <>
      <div className="w-full mt-8">
        <div className="col-span-8 bg-surface-100 px-5 py-4 border rounded-md">
          <TerminalInstructions />
        </div>
      </div>
    </>
  )
}

export default FunctionsEmptyState
