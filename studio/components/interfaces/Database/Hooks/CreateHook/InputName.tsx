import { FC, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Input } from 'ui'
import { CreateHookContext } from './'

const InputName: FC = observer(({}) => {
  const _localState: any = useContext(CreateHookContext)
  return (
    <Input
      id="name"
      label="Name"
      layout="horizontal"
      placeholder="Name of your function hook"
      value={_localState.formState.name.value}
      onChange={(e) =>
        _localState.onFormChange({
          key: 'name',
          value: e.target.value,
        })
      }
      size="medium"
      error={_localState.formState.name.error}
    />
  )
})

export default InputName
