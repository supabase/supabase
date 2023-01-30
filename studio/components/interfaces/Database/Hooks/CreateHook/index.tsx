import { makeAutoObservable } from 'mobx'
import { FC, useEffect, createContext } from 'react'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { isEmpty, mapValues, has, filter, keyBy, isUndefined } from 'lodash'
import { Dictionary } from 'components/grid'
import { Badge, Input, SidePanel } from 'ui'
import { useStore } from 'hooks'

import InputName from './InputName'
import SelectEnabledMode from './SelectEnabledMode'
import CheckboxEvents from './CheckboxEvents'
import TableSelection from './TableSelection'
import RadioGroupHookService from './RadioGroupHookService'
import ServiceConfigForm from './ServiceConfigForm'

import { formatArguments, convertKeyValue, hasWhitespace, isValidHttpUrl } from '../Hooks.utils'

// [Joshen] TODO: Refactor to use Form component

class CreateHookFormState {
  id: number | undefined
  originalName: string | undefined
  // @ts-ignore
  enabledMode: { value: string }
  // @ts-ignore
  events: { value: string[]; error?: string }
  // @ts-ignore
  name: { value: string; error?: string }
  // @ts-ignore
  schema: { value: string }
  // @ts-ignore
  table: { value: string; error?: string }
  // @ts-ignore
  tableId: { value: number; error?: string }
  // @ts-ignore
  hookService: { value: string; error?: string }
  // @ts-ignore
  serviceUrl: { value: string; error?: string }
  // @ts-ignore
  serviceMethod: { value: string; error?: string }
  // @ts-ignore
  serviceHeaders: {
    value: { name: string; value: string; error?: { name?: string; value?: string } }[]
  }
  // @ts-ignore
  serviceParams: {
    value: { name: string; value: string; error?: { name?: string; value?: string } }[]
  }
  // @ts-ignore
  serviceTimeoutMs: { value: string; error?: string }

  constructor() {
    makeAutoObservable(this)
    this.reset()
  }

  get requestBody() {
    return {
      id: this.id,
      activation: 'AFTER',
      enabled_mode: this.enabledMode.value,
      events: this.events.value,
      function_args: [
        this.serviceUrl.value.replaceAll(' ', ''),
        this.serviceMethod.value,
        JSON.stringify(mapValues(keyBy(this.serviceHeaders.value, 'name'), 'value')),
        formatArguments(this.serviceParams.value),
        this.serviceTimeoutMs.value,
      ],
      function_name: 'http_request',
      function_schema: 'supabase_functions',
      orientation: 'ROW',
      name: this.name.value,
      schema: this.schema.value,
      table: this.table.value,
      table_id: this.tableId.value,
    }
  }

  reset(hook?: Dictionary<any>) {
    this.id = hook?.id
    this.originalName = hook?.name
    this.enabledMode = { value: hook?.enabled_mode ?? 'ORIGIN' }
    this.events = { value: hook?.events ?? [] }
    this.name = { value: hook?.name ?? '' }
    this.schema = { value: hook?.schema ?? '' }
    this.table = { value: hook?.table ?? '' }
    this.tableId = { value: hook?.table_id ?? '' }
    // TODO: hook obj doesn't have service field
    this.hookService = { value: 'http_request' }
    /**
     * hook.function_args contains 5 params in order
     * [url, method, headers, params, timeout]
     */
    this.serviceUrl = { value: hook?.function_args?.length == 5 ? hook?.function_args[0] : '' }
    this.serviceMethod = {
      value: hook?.function_args?.length == 5 ? hook?.function_args[1] : 'GET',
    }
    this.serviceHeaders =
      hook?.function_args?.length == 5
        ? convertKeyValue(hook?.function_args[2])
        : { value: [{ name: 'Content-type', value: 'application/json' }] }

    this.serviceParams =
      hook?.function_args?.length == 5 ? convertKeyValue(hook?.function_args[3]) : { value: [] }

    this.serviceTimeoutMs = {
      value: hook?.function_args?.length == 5 ? hook?.function_args[4] : '1000',
    }
  }

  update(state: Dictionary<any>) {
    this.enabledMode = state.enabledMode
    this.events = state.events
    this.name = state.name
    this.schema = state.schema
    this.table = state.table
    this.tableId = state.tableId
    this.hookService = state.hookService
    this.serviceUrl = state.serviceUrl
    this.serviceMethod = state.serviceMethod
    this.serviceHeaders = state.serviceHeaders
    this.serviceParams = state.serviceParams
    this.serviceTimeoutMs = state.serviceTimeoutMs
  }
}

interface ICreateHookStore {
  loading: boolean
  formState: CreateHookFormState
  meta: any
  project: any
  tables: Dictionary<any>[]
  onFormChange: (value: { key: string; value: any }) => void
  onFormArrayChange: (value: {
    operation: 'add' | 'delete' | 'update'
    key: string
    idx?: number
    value?: any
  }) => void
  setDefaultSelectedTable: () => void
  setLoading: (value: boolean) => void
  setTables: (value: Dictionary<any>[]) => void
  validateForm: () => boolean
}

class CreateHookStore implements ICreateHookStore {
  loading = false
  formState = new CreateHookFormState()
  meta = null
  project = null
  tables = []

  constructor() {
    makeAutoObservable(this)
  }

  get title() {
    return this.formState.id
      ? `Edit '${this.formState.originalName}' database webhook`
      : 'Add a new database webhook'
  }

  get isEditing() {
    return this.formState.id != undefined
  }

  // set first table as default selection
  setDefaultSelectedTable = () => {
    if (this.tables?.length != 0) {
      this.formState.schema.value = (this.tables[0] as any).schema
      this.formState.table.value = (this.tables[0] as any).name
      this.formState.tableId.value = (this.tables[0] as any).id
    }
  }

  setLoading = (value: boolean) => {
    this.loading = value
  }

  setTables = (value: Dictionary<any>[]) => {
    this.tables = value as any
    this.setDefaultSelectedTable()
  }

  onFormChange = ({ key, value }: { key: string; value: any }) => {
    if (has(this.formState, key)) {
      const temp = (this.formState as any)[key] as any
      ;(this.formState as any)[key] = { ...temp, value, error: undefined }
    } else {
      ;(this.formState as any)[key] = { value }
    }
  }

  onFormArrayChange = ({
    operation,
    key,
    idx,
    value,
  }: {
    operation: 'add' | 'delete' | 'update'
    key: string
    idx?: number
    value?: any
  }) => {
    switch (operation) {
      case 'add': {
        if (has(this.formState, key)) {
          ;(this.formState as any)[key].value.push(value)
        } else {
          ;(this.formState as any)[key] = { value: [value] }
        }
        break
      }
      case 'delete': {
        if (has(this.formState, key)) {
          const temp = filter(
            (this.formState as any)[key].value,
            (_: any, index: number) => index != idx
          ) as any
          ;(this.formState as any)[key].value = temp
        }
        break
      }
      default: {
        if (has(this.formState, key) && !isUndefined(idx)) {
          ;(this.formState as any)[key].value[idx] = value
        } else {
          ;(this.formState as any)[key] = { value: [{ value }] }
        }
      }
    }
  }

  validateForm = () => {
    let isValidated = true
    const _state = mapValues(this.formState, (x: { value: any }, key: string) => {
      switch (key) {
        case 'name': {
          if (isEmpty(x.value) || hasWhitespace(x.value)) {
            isValidated = false
            return { ...x, error: 'Invalid hook name' }
          } else {
            return x
          }
        }
        case 'events': {
          if (isEmpty(x.value)) {
            isValidated = false
            return { ...x, error: 'Select at least 1 event' }
          } else {
            return x
          }
        }
        case 'table': {
          if (isEmpty(x.value)) {
            isValidated = false
            return { ...x, error: 'You must choose a table' }
          } else {
            return x
          }
        }
        case 'hookService': {
          if (x.value != 'http_request') {
            isValidated = false
            return { ...x, error: 'Not supported service' }
          } else {
            return x
          }
        }
        case 'serviceTimeoutMs': {
          if (isEmpty(x.value) || isNaN(x.value)) {
            isValidated = false
            return { ...x, error: 'Invalid input' }
          } else {
            return x
          }
        }
        case 'serviceUrl': {
          if (isEmpty(x.value) || !isValidHttpUrl(x.value)) {
            isValidated = false
            return { ...x, error: 'Invalid input' }
          } else {
            return x
          }
        }
        case 'serviceMethod': {
          if (isEmpty(x.value)) {
            isValidated = false
            return { ...x, error: 'Invalid input' }
          } else {
            return x
          }
        }
        case 'serviceHeaders':
        case 'serviceParams': {
          const temp = x.value?.map((i: Dictionary<any>) => {
            const error: any = { name: undefined, value: undefined }
            if (isEmpty(i.name) || hasWhitespace(i.name)) {
              isValidated = false
              error.name = 'Invalid name'
            }
            if (isEmpty(i.value)) {
              isValidated = false
              error.value = 'Missing value'
            }
            return { ...i, error }
          })
          x.value = temp
          return x
        }
        default:
          return x
      }
    })
    if (!isValidated) {
      this.formState.update(_state)
    }
    return isValidated
  }
}

export const CreateHookContext = createContext<ICreateHookStore | null>(null)

interface CreateHookProps {
  hook?: any
  visible: boolean
  setVisible: (value: boolean) => void
}

const CreateHook: FC<CreateHookProps> = ({ hook, visible = true, setVisible }) => {
  const { meta, ui } = useStore()
  const project = ui.selectedProject

  const _localState: any = useLocalObservable(() => new CreateHookStore())
  _localState.meta = meta
  _localState.project = project

  useEffect(() => {
    const fetchSchemas = async () => {
      await _localState.meta.tables.load()
      const tables = _localState!.meta!.tables.list(
        (table: any) => !meta.excludedSchemas.includes(table.schema)
      )
      _localState.setTables(tables)
    }

    fetchSchemas()
  }, [])

  useEffect(() => {
    if (hook) {
      _localState.formState.reset(hook)
    } else {
      _localState.formState.reset()
      _localState.setDefaultSelectedTable()
    }
  }, [visible, hook])

  async function handleSubmit() {
    try {
      if (_localState.validateForm()) {
        _localState.setLoading(true)

        const body = _localState.formState.requestBody

        const response: any = _localState.isEditing
          ? await _localState.meta.hooks.update(body.id, body)
          : await _localState.meta.hooks.create(body)

        if (response.error) {
          ui.setNotification({
            category: 'error',
            message: `Failed to create hook: ${response.error.message ?? 'Submit request failed'}`,
          })
          _localState.setLoading(false)
        } else {
          ui.setNotification({
            category: 'success',
            message: `${_localState.isEditing ? 'Updated' : 'Created new'} hook called ${
              response.name
            }`,
          })
          _localState.setLoading(false)
          setVisible(!visible)
        }
      }
    } catch (error: any) {
      ui.setNotification({ category: 'error', message: `Failed to create hook: ${error.message}` })
      _localState.setLoading(false)
    }
  }

  return (
    <SidePanel
      size="large"
      visible={visible}
      loading={_localState.loading}
      header={_localState.title}
      className="hooks-sidepanel mr-0 transform transition-all duration-300 ease-in-out"
      onConfirm={handleSubmit}
      onCancel={() => setVisible(!visible)}
    >
      <CreateHookContext.Provider value={_localState}>
        <div className="space-y-10 py-6">
          {_localState.isEditing ? (
            <>
              <div className="space-y-10 px-6">
                <InputName />
                <SelectEnabledMode />
              </div>

              {_localState.formState.serviceHeaders.value.length > 0 && (
                <>
                  <SidePanel.Separator />
                  <div className="space-y-2 px-6">
                    <div className="flex items-center space-x-2">
                      <h5 className="text-base text-scale-1200">HTTP Headers</h5>
                      <Badge color="gray">Read only</Badge>
                    </div>
                    <div className="space-y-2">
                      {_localState.formState.serviceHeaders.value.map(
                        (serviceHeader: { name: string; value: string }) => (
                          <div
                            key={serviceHeader.name}
                            className="flex items-center justify-center space-x-2"
                          >
                            <Input
                              disabled
                              className="w-full flex-1"
                              readOnly
                              value={serviceHeader.name}
                            />
                            <Input
                              disabled
                              className="w-full flex-1"
                              readOnly
                              value={serviceHeader.value}
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  <p className="mx-6 mt-12 text-sm text-scale-1100">
                    <strong>Note:</strong> You can only edit a webhook's name and mode. To change
                    other settings, you'll need to delete and recreate the webhook.
                  </p>
                </>
              )}

              {_localState.formState.serviceParams.value.length > 0 && (
                <>
                  <SidePanel.Separator />
                  <div className="space-y-2 px-6">
                    <div className="flex items-center space-x-2">
                      <h5 className="text-base text-scale-1200">HTTP Parameters</h5>
                      <Badge color="gray">Read only</Badge>
                    </div>
                    <div className="space-y-2">
                      {_localState.formState.serviceParams.value.map(
                        (serviceParam: { name: string; value: string }) => (
                          <div
                            key={serviceParam.name}
                            className="flex items-center justify-center space-x-2"
                          >
                            <Input
                              disabled
                              className="w-full flex-1"
                              readOnly
                              value={serviceParam.name}
                            />
                            <Input
                              disabled
                              className="w-full flex-1"
                              readOnly
                              value={serviceParam.value}
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="px-6">
                <InputName />
              </div>
              <SidePanel.Separator />
              <div className="space-y-6 px-6">
                <h5 className="text-base text-scale-1200">Conditions to fire hook</h5>
                <TableSelection />
                <CheckboxEvents />
              </div>
              <SidePanel.Separator />
              <div className="space-y-6 px-6">
                <h5 className="text-base text-scale-1200">Type of hook</h5>
                <RadioGroupHookService />
              </div>
              <ServiceConfigForm />
            </>
          )}
        </div>
      </CreateHookContext.Provider>
    </SidePanel>
  )
}

export default observer(CreateHook)
