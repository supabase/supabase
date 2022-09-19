import { FC, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Select } from 'ui'
import { CreateHookContext } from '../'

const SelectServiceMethod: FC = observer(({}) => {
  const _localState: any = useContext(CreateHookContext)
  return (
    <Select
      id="method"
      label="Method"
      layout="horizontal"
      value={_localState.formState.serviceMethod.value}
      onChange={(e) =>
        _localState.onFormChange({
          key: 'serviceMethod',
          value: e.target.value,
        })
      }
      size="small"
    >
      <Select.Option value="GET">GET</Select.Option>
      <Select.Option value="POST">POST</Select.Option>
    </Select>
  )
})

export default SelectServiceMethod
