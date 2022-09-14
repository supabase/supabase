import { FC, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Radio } from 'ui'

import { CreateHookContext } from '../'
import RadioHookService from './RadioHookService'
import { hookServiceOptions } from './RadioGroupHookService.constants'

const RadioGroupHookService: FC = observer(({}) => {
  const _localState: any = useContext(CreateHookContext)
  return (
    <>
      <div className="provider-radio-group">
        <Radio.Group
          type="cards"
          layout="vertical"
          onChange={(event) => {
            _localState.onFormChange({
              key: 'hookService',
              value: event.target.value,
            })
          }}
          value={_localState.formState.hookService.value}
          error={_localState.formState.hookService.error}
        >
          {hookServiceOptions.map((x) => (
            <RadioHookService key={x.id} {...x} />
          ))}
        </Radio.Group>
      </div>
    </>
  )
})

export default RadioGroupHookService
