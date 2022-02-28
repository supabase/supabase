import { FC, useEffect, createContext, useContext, FormEvent } from 'react'
import Link from 'next/link'
import { makeAutoObservable } from 'mobx'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { isEmpty, mapValues, has, without, union, filter, keyBy, isUndefined } from 'lodash'
import { Dictionary } from '@supabase/grid'
import {
  Input,
  SidePanel,
  Checkbox,
  Listbox,
  Typography,
  Button,
  Radio,
  Select,
  Badge,
  IconTrash,
  IconPlus,
  Alert,
} from '@supabase/ui'

import Image from 'next/image'
import SVG from 'react-inlinesvg'
import { useStore } from 'hooks'

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
        this.serviceUrl.value,
        this.serviceMethod.value,
        JSON.stringify(mapValues(keyBy(this.serviceHeaders.value, 'name'), 'value')),
        JSON.stringify(mapValues(keyBy(this.serviceParams.value, 'name'), 'value')),
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

/**
 * convert "{\"Content-type\":\"application/json\"}"
 * to {value: [{name: 'search_path', value: 'auth, public'}]}
 */
function convertKeyValue(value: string) {
  const temp = []
  if (value) {
    const obj = JSON.parse(value)
    for (var key in obj) {
      temp.push({ name: key, value: obj[key] })
    }
  }
  return { value: temp }
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
      ? `Edit '${this.formState.originalName}' function hook`
      : 'Add a new function hook'
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

function hasWhitespace(value: string) {
  return /\s/.test(value)
}

function isValidHttpUrl(value: string) {
  let url: URL
  try {
    url = new URL(value)
  } catch (_) {
    return false
  }
  return url.protocol === 'http:' || url.protocol === 'https:'
}

const CreateHookContext = createContext<ICreateHookStore | null>(null)

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
      onCancel={() => setVisible(!visible)}
      header={_localState.title}
      className={
        'hooks-sidepanel transform transition-all duration-300 ease-in-out mr-0 ' + '' // (showCreateFunctionSidePanel ? 'mr-16' : '')
      }
      loading={_localState.loading}
      onConfirm={handleSubmit}
    >
      <CreateHookContext.Provider value={_localState}>
        <div className="space-y-10 py-6">
          {_localState.isEditing ? (
            <div className="px-6 space-y-10 py-6">
              <InputName />
              <SelectEnabledMode />
            </div>
          ) : (
            <>
              <div className="px-6">
                <InputName />
              </div>
              <SidePanel.Seperator />
              <div className="px-6 space-y-6">
                <h5 className="text-base text-scale-1200">Conditions to fire hook</h5>
                <ListboxTable />
                <CheckboxEvents />
              </div>
              <SidePanel.Seperator />
              <div className="px-6 space-y-6">
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

const CheckboxEvents: FC = observer(({}) => {
  const _localState: any = useContext(CreateHookContext)
  return (
    // @ts-ignore
    <Checkbox.Group
      name="events"
      label="Events"
      id="events"
      layout="horizontal"
      size="medium"
      onChange={(e) => {
        const temp = _localState.formState.events.value
        const value = e.target.checked
          ? union(temp, [e.target.value])
          : without(temp, e.target.value)
        _localState.onFormChange({
          key: 'events',
          value: value,
        })
      }}
      error={_localState.formState.events.error}
      labelOptional="The type of events that will trigger your function hook"
      descriptionText="These are the events that are watched by the function hook, only the events selected above will fire the function hook on the table you've selected."
    >
      <Checkbox
        value="INSERT"
        id="INSERT"
        label="Insert"
        description={'Any insert operation on the table'}
        checked={_localState.formState.events.value.includes('INSERT')}
      />
      <Checkbox
        value="UPDATE"
        id="UPDATE"
        label="Update"
        description="Any update operation, of any column in the table"
        checked={_localState.formState.events.value.includes('UPDATE')}
      />
      <Checkbox
        value="DELETE"
        id="DELETE"
        label="Delete"
        description="Any deletion of a record"
        checked={_localState.formState.events.value.includes('DELETE')}
      />
    </Checkbox.Group>
  )
})

const ListboxTable: FC = observer(({}) => {
  const { ui } = useStore()
  const projectRef = ui.selectedProject?.ref
  const _localState: any = useContext(CreateHookContext)

  if (_localState.tables.length === 0) {
    return (
      <Input
        label="Table"
        layout="horizontal"
        disabled
        placeholder="No tables created, please create one first"
        // @ts-ignore
        descriptionText={
          <div className="space-x-1">
            <Typography.Text type="secondary">
              This is the table the trigger will watch for changes. There's currently no tables
              created - please create one
            </Typography.Text>
            <Link href={`/project/${projectRef}/editor`}>
              <a>
                <Typography.Link>here</Typography.Link>
              </a>
            </Link>
            <Typography.Text type="secondary">first.</Typography.Text>
          </div>
        }
      />
    )
  }

  return (
    <Listbox
      id="table"
      label="Table"
      layout="horizontal"
      value={_localState.formState.tableId.value}
      onChange={(id) => {
        const _table = _localState.tables.find((x: any) => x.id === id)
        if (_table) {
          _localState.onFormChange({
            key: 'schema',
            value: _table.schema,
          })
          _localState.onFormChange({
            key: 'table',
            value: _table.name,
          })
          _localState.onFormChange({
            key: 'tableId',
            value: id,
          })
        }
      }}
      size="medium"
      error={_localState.formState.table.error}
      descriptionText="This is the table the trigger will watch for changes. You can only select 1 table for a trigger."
    >
      {_localState.tables.map((x: any) => {
        return (
          <Listbox.Option
            id={x.id}
            key={x.id}
            value={x.id}
            label={x.name}
            addOnBefore={() => (
              <div className="bg-scale-1200 p-1 flex items-center justify-center rounded text-scale-100 ">
                <SVG
                  src={'/img/table-editor.svg'}
                  style={{ width: `16px`, height: `16px`, strokeWidth: '1px' }}
                  preProcessor={(code) =>
                    code.replace(/svg/, 'svg class="m-auto text-color-inherit"')
                  }
                />
              </div>
            )}
          >
            <div className="flex flex-row items-center space-x-1">
              <Typography.Text>{x.name}</Typography.Text>
              <Typography.Text type="secondary" className="opacity-50" small>
                {x.schema}
              </Typography.Text>
            </div>
          </Listbox.Option>
        )
      })}
    </Listbox>
  )
})

const hookServiceOptions: {
  id: string
  label: string
  badge: string
  badgeType: 'brand' | 'amber'
  description: string
  img_url: string
}[] = [
  {
    id: 'http_request',
    label: 'HTTP Request',
    badge: 'Alpha',
    badgeType: 'brand',
    description: 'Send an HTTP request to any URL.',
    img_url: 'http-request.png',
  },
  {
    id: 'supabase_function',
    label: 'Supabase Function',
    badge: 'Coming soon',
    badgeType: 'amber',
    description: 'Choose a Supabase Function to run.',
    img_url: 'supabase-severless-function.png',
  },
  {
    id: 'google_cloud_function',
    label: 'Google cloud run',
    badge: 'Coming soon',
    badgeType: 'amber',
    description: 'Choose a google cloud function to run',
    img_url: 'google-cloud-run.png',
  },
  {
    id: 'aws_lambda_function',
    label: 'AWS Lambda',
    badge: 'Coming soon',
    badgeType: 'amber',
    description: 'Choose an AWS Lambda function to run.',
    img_url: 'aws-lambda-severless-function.png',
  },
]
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

interface RadioHookService {
  id: string
  description: string
  label: string
  img_url: string
  badgeType: 'brand' | 'amber'
  badge: string
}

const RadioHookService: FC<RadioHookService> = observer(
  ({ id, description, label, img_url, badgeType, badge }) => {
    const _localState: any = useContext(CreateHookContext)
    return (
      <Radio
        id={id}
        value={id}
        checked={_localState.formState.hookService.value == id}
        // @ts-ignore
        beforeLabel={
          <>
            <div className="flex items-center space-x-5">
              {/* <div className="h-3 w-3"> */}
              <Image
                src={`/img/function-providers/${img_url}`}
                layout="fixed"
                width="32"
                height="32"
              />
              {/* </div> */}
              <div className="flex-col space-y-0">
                <div className="flex space-x-1">
                  <span className="text-scale-1200">{label}</span>
                  <Badge color={badgeType}>{badge}</Badge>
                </div>
                <span className="text-scale-900">{description}</span>
              </div>
            </div>
          </>
        }
      />
    )
  }
)

const ServiceConfigForm: FC = observer(({}) => {
  const _localState: any = useContext(CreateHookContext)
  return (
    <>
      {_localState.formState.hookService.value === 'http_request' ? (
        <>
          <SidePanel.Seperator />
          <div className="space-y-10">
            <div className="px-6 space-y-6">
              <Typography.Title level={5}>HTTP Request</Typography.Title>
              <SelectServiceMethod />
              <InputServiceUrl />
              {/* <InputServiceTimeout /> */}
            </div>
            <SidePanel.Seperator />
            <div className="px-6">
              <InputMultiServiceHeaders />
            </div>
            <SidePanel.Seperator />
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

const InputServiceTimeout: FC = observer(({}) => {
  const _localState: any = useContext(CreateHookContext)
  return (
    <Input
      id="timeout-ms"
      type="number"
      label="Request timeout"
      layout="horizontal"
      descriptionText="Request timeout value in millisecond"
      value={_localState.formState.serviceTimeoutMs.value}
      onChange={(e) =>
        _localState.onFormChange({
          key: 'serviceTimeoutMs',
          value: e.target.value,
        })
      }
      size="medium"
      error={_localState.formState.serviceTimeoutMs.error}
    />
  )
})

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
      <div className="flex justify-between items-center">
        <Typography.Text>HTTP Headers</Typography.Text>
      </div>
      <div className="pt-4 space-y-2">
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

interface InputServiceHeaderProps {
  idx: number
  name: string
  value: string
  error?: { name?: string; value?: string }
}
const InputServiceHeader: FC<InputServiceHeaderProps> = observer(({ idx, name, value, error }) => {
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
      <div className="flex justify-between items-center">
        <Typography.Text>HTTP Params</Typography.Text>
      </div>
      <div className="pt-4 space-y-2">
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

interface InputServiceParamsProps {
  idx: number
  name: string
  value: string
  error?: { name?: string; value?: string }
}
const InputServiceParam: FC<InputServiceParamsProps> = observer(({ idx, name, value, error }) => {
  const _localState: any = useContext(CreateHookContext)

  function onNameChange(e: FormEvent<HTMLInputElement>) {
    const _value = e.currentTarget.value
    _localState.onFormArrayChange({
      key: 'serviceParams',
      value: { name: _value, value },
      idx,
      operation: 'update',
    })
  }

  function onValueChange(e: FormEvent<HTMLInputElement>) {
    const _value = e.currentTarget.value
    _localState.onFormArrayChange({
      key: 'serviceParams',
      value: { name, value: _value },
      idx,
      operation: 'update',
    })
  }

  function onDelete() {
    _localState.onFormArrayChange({
      key: 'serviceParams',
      idx,
      operation: 'delete',
    })
  }

  return (
    <div className="flex space-x-1">
      <Input
        id={`name-${idx}`}
        className="flex-1"
        placeholder="Param name"
        value={name}
        onChange={onNameChange}
        size="small"
        error={error?.name}
      />
      <Input
        id={`value-${idx}`}
        className="flex-1"
        placeholder="Param value"
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

const ServiceUnavailableBox: FC = observer(({}) => {
  const _localState: any = useContext(CreateHookContext)
  return (
    <Alert variant="warning" title="Service under development" withIcon>
      <div className="space-y-4">
        <div>We currently do not support this service.</div>
        <Button
          type="default"
          className="flex-grow"
          onClick={() =>
            _localState.onFormChange({
              key: 'hookService',
              value: 'http_request',
            })
          }
        >
          Switch to HTTP
        </Button>
      </div>
    </Alert>
  )
})
