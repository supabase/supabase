import { FC, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, IconPlus } from 'ui'

import { CreateHookContext } from '../'
import InputServiceHeader from './InputServiceHeader'

const InputMultiServiceHeaders: FC = observer(({}) => {
  const _localState: any = useContext(CreateHookContext)

  function onAddArgument() {
    _localState.onFormArrayChange({
      key: 'serviceHeaders',
      value: { name: '', value: '' },
      operation: 'add',
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h5>HTTP Headers</h5>
      </div>
      <div className="space-y-2 pt-4">
        {_localState.formState.serviceHeaders.value.map(
          (
            x: { name: string; value: string; error?: { name?: string; value?: string } },
            idx: number
          ) => (
            <InputServiceHeader
              key={`serviceHeader-${idx}`}
              idx={idx}
              name={x.name}
              value={x.value}
              error={x.error}
            />
          )
        )}
        <div className="">
          <Button type="dashed" icon={<IconPlus />} onClick={onAddArgument}>
            Add a new header
          </Button>
        </div>
      </div>
    </div>
  )
})

export default InputMultiServiceHeaders
