import SVG from 'react-inlinesvg'
import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, IconArrowLeft } from '@supabase/ui'

import { withAuth, useFlag } from 'hooks'
import Success from 'components/interfaces/Support/Success'
import SupportForm from 'components/interfaces/Support/SupportForm'

const SupportPage = () => {
  const [sent, setSent] = useState<boolean>(false)

  const ongoingIncident = useFlag('ongoingIncident')
  const maxHeight = ongoingIncident ? 'calc(100vh - 44px)' : '100vh'

  return (
    <div
      className="relative flex overflow-y-auto overflow-x-hidden"
      style={{ height: maxHeight, maxHeight }}
    >
      <div className="mx-auto my-8 max-w-2xl px-4 lg:px-6">
        <Button
          type="text"
          className="opacity-50 hover:opacity-100"
          style={{ background: 'none', padding: 0 }}
          onClick={function goBack() {
            window.history.back()
          }}
          icon={<IconArrowLeft />}
        >
          Go back
        </Button>
        <div className="space-y-12 py-8">
          <div className="flex items-center space-x-3">
            <SVG src={`/img/supabase-logo.svg`} className="h-4 w-4" />
            <h4 className="m-0 text-lg">Supabase support</h4>
          </div>
          <div className="bg-panel-body-light dark:bg-panel-body-dark dark:border-dark min-w-full space-y-12 rounded border py-8 shadow-md">
            {sent ? <Success /> : <SupportForm setSent={setSent} />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default withAuth(observer(SupportPage))
