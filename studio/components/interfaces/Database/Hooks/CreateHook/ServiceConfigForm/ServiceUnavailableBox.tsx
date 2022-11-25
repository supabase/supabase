import { FC, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Alert, Button } from 'ui'
import { CreateHookContext } from '../'

const ServiceUnavailableBox: FC = observer(({}) => {
  const _localState: any = useContext(CreateHookContext)
  return (
    <Alert variant="warning" title="Service under development" withIcon>
      <div className="space-y-4">
        <div>We currently do not support this service.</div>
        <Button
          type="default"
          className="flex-grow"
          onClick={() =>
            _localState.onFormChange({
              key: 'hookService',
              value: 'http_request',
            })
          }
        >
          Switch to HTTP
        </Button>
      </div>
    </Alert>
  )
})

export default ServiceUnavailableBox
