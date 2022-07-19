import { FC, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Typography, Button, IconPlus } from '@supabase/ui'

import { CreateHookContext } from '../'
import InputServiceParam from './InputServiceParam'

const InputMultiServiceParams: FC = observer(({}) => {
  const _localState: any = useContext(CreateHookContext)

  function onAddArgument() {
    _localState.onFormArrayChange({
      key: 'serviceParams',
      value: { name: '', value: '' },
      operation: 'add',
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <Typography.Text>HTTP Params</Typography.Text>
      </div>
      <div className="space-y-2 pt-4">
        {_localState.formState.serviceParams.value.map(
          (
            x: { name: string; value: string; error?: { name?: string; value?: string } },
            idx: number
          ) => (
            <InputServiceParam
              key={`serviceParam-${idx}`}
              idx={idx}
              name={x.name}
              value={x.value}
              error={x.error}
            />
          )
        )}
        <Button type="dashed" icon={<IconPlus />} onClick={onAddArgument}>
          Add a new param
        </Button>
      </div>
    </div>
  )
})

export default InputMultiServiceParams
