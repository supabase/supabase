import { FC, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Input } from 'ui'
import { CreateHookContext } from '../'

const InputServiceUrl: FC = observer(({}) => {
  const _localState: any = useContext(CreateHookContext)
  return (
    <Input
      id="service-url"
      type="url"
      label="URL"
      layout="horizontal"
      placeholder="http://api.com/path/resource"
      descriptionText="URL of the HTTP request. Must include HTTP/HTTPS"
      value={_localState.formState.serviceUrl.value}
      onChange={(e) =>
        _localState.onFormChange({
          key: 'serviceUrl',
          value: e.target.value,
        })
      }
      size="medium"
      error={_localState.formState.serviceUrl.error}
    />
  )
})

export default InputServiceUrl
