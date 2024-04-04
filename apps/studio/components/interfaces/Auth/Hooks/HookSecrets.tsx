import { useEffect } from 'react'
import { Input, Button } from 'ui'
import Panel from 'components/ui/Panel'

import {
  FormActions,
  FormHeader,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'

const HookSecrets = () => {
  return (
    <>
      <Panel
        title={
          <div className="space-y-3">
            <h5 className="text-base">HTTP Hook Secret</h5>
            <p className="text-sm text-foreground-light">
              The Hook payload is encrypted while in transit. Use the Hook Secret to decrypt the
              payload.
            </p>
          </div>
        }
        disabled={true}
      >
        <Panel.Content>
          <Input
            readOnly
            disabled
            className="input-mono"
            copy={true}
            reveal={true}
            value={'test'}
            onChange={() => {}}
          />
        </Panel.Content>
      </Panel>
    </>
  )
}
export default HookSecrets
