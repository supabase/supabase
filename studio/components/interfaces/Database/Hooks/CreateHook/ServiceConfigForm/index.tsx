import { FC, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { SidePanel } from 'ui'

import { CreateHookContext } from '../'
import SelectServiceMethod from './SelectServiceMethod'
import InputServiceUrl from './InputServiceUrl'
import InputMultiServiceHeaders from './InputMultiServiceHeaders'
import InputMultiServiceParams from './InputMultiServiceParams'
import ServiceUnavailableBox from './ServiceUnavailableBox'

const ServiceConfigForm: FC = observer(({}) => {
  const _localState: any = useContext(CreateHookContext)
  return (
    <>
      {_localState.formState.hookService.value === 'http_request' ? (
        <>
          <SidePanel.Separator />
          <div className="space-y-10">
            <div className="space-y-6 px-6">
              <h5>HTTP Request</h5>
              <SelectServiceMethod />
              <InputServiceUrl />
            </div>
            <SidePanel.Separator />
            <div className="px-6">
              <InputMultiServiceHeaders />
            </div>
            <SidePanel.Separator />
            <div className="px-6">
              <InputMultiServiceParams />
            </div>
          </div>
        </>
      ) : (
        <div className="px-6">
          <ServiceUnavailableBox />
        </div>
      )}
    </>
  )
})

export default ServiceConfigForm
