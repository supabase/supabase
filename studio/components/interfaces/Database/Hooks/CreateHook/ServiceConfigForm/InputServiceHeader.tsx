import { FC, useContext, FormEvent } from 'react'
import { observer } from 'mobx-react-lite'
import { Input, IconTrash, Button } from 'ui'
import { CreateHookContext } from '../'

interface Props {
  idx: number
  name: string
  value: string
  error?: { name?: string; value?: string }
}

const InputServiceHeader: FC<Props> = observer(({ idx, name, value, error }) => {
  const _localState: any = useContext(CreateHookContext)

  function onNameChange(e: FormEvent<HTMLInputElement>) {
    const _value = e.currentTarget.value
    _localState.onFormArrayChange({
      key: 'serviceHeaders',
      value: { name: _value, value },
      idx,
      operation: 'update',
    })
  }

  function onValueChange(e: FormEvent<HTMLInputElement>) {
    const _value = e.currentTarget.value
    _localState.onFormArrayChange({
      key: 'serviceHeaders',
      value: { name, value: _value },
      idx,
      operation: 'update',
    })
  }

  function onDelete() {
    _localState.onFormArrayChange({
      key: 'serviceHeaders',
      idx,
      operation: 'delete',
    })
  }

  return (
    <div className="flex space-x-1">
      <Input
        id={`name-${idx}`}
        className="flex-1"
        placeholder="Header name"
        value={name}
        onChange={onNameChange}
        size="small"
        error={error?.name}
      />
      <Input
        id={`value-${idx}`}
        className="flex-1"
        placeholder="Header value"
        value={value}
        onChange={onValueChange}
        size="small"
        error={error?.value}
      />
      <div>
        <Button
          danger
          type="primary"
          icon={<IconTrash size="tiny" />}
          onClick={onDelete}
          size="small"
        />
      </div>
    </div>
  )
})

export default InputServiceHeader
