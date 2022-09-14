import { FC, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Input } from 'ui'
import { CreateHookContext } from '../'

// Not used currently

const InputServiceTimeout: FC = observer(({}) => {
  const _localState: any = useContext(CreateHookContext)
  return (
    <Input
      id="timeout-ms"
      type="number"
      label="Request timeout"
      layout="horizontal"
      descriptionText="Request timeout value in millisecond"
      value={_localState.formState.serviceTimeoutMs.value}
      onChange={(e) =>
        _localState.onFormChange({
          key: 'serviceTimeoutMs',
          value: e.target.value,
        })
      }
      size="medium"
      error={_localState.formState.serviceTimeoutMs.error}
    />
  )
})

export default InputServiceTimeout
