import { FC, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Select } from 'ui'
import { CreateHookContext } from './'

const SelectEnabledMode: FC = observer(({}) => {
  const _localState: any = useContext(CreateHookContext)
  return (
    <Select
      id="enabled-mode"
      label="Enabled mode"
      layout="horizontal"
      value={_localState.formState.enabledMode.value}
      onChange={(e) =>
        _localState.onFormChange({
          key: 'enabledMode',
          value: e.target.value,
        })
      }
      size="small"
    >
      <Select.Option value="ORIGIN">Origin</Select.Option>
      <Select.Option value="REPLICA">Replica</Select.Option>
      <Select.Option value="ALWAYS">Always</Select.Option>
      <Select.Option value="DISABLED">Disabled</Select.Option>
    </Select>
  )
})

export default SelectEnabledMode
