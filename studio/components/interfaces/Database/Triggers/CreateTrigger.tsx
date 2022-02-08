import { FC, useEffect, createContext, useContext } from 'react'
import { makeAutoObservable } from 'mobx'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { isEmpty, mapValues, has, without, union } from 'lodash'
import {
  Input,
  SidePanel,
  Divider,
  Checkbox,
  Listbox,
  Typography,
  IconPlayCircle,
  IconPauseCircle,
  IconTerminal,
  IconTool,
  Badge,
} from '@supabase/ui'
import { Dictionary } from '@supabase/grid'
import { useRouter } from 'next/router'
import SVG from 'react-inlinesvg'

import ChooseFunctionForm from './ChooseFunctionForm'
import FormEmptyBox from 'components/to-be-cleaned/FormBoxEmpty'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { useStore } from 'hooks'

class CreateTriggerFormState {
  id: number | undefined
  originalName: string | undefined
  // @ts-ignore
  activation: { value: string; error?: string }
  // @ts-ignore
  enabledMode: { value: string }
  // @ts-ignore
  events: { value: string[]; error?: string }
  // @ts-ignore
  functionName: { value: string; error?: string }
  // @ts-ignore
  functionSchema: { value: string; error?: string }
  // @ts-ignore
  orientation: { value: string; error?: string }
  // @ts-ignore
  name: { value: string; error?: string }
  // @ts-ignore
  schema: { value: string }
  // @ts-ignore
  table: { value: string }
  // @ts-ignore
  tableId: { value: number; error?: string }

  constructor() {
    makeAutoObservable(this)
    this.reset()
  }

  get requestBody() {
    return {
      id: this.id,
      activation: this.activation.value,
      enabled_mode: this.enabledMode.value,
      events: this.events.value,
      function_name: this.functionName.value,
      function_schema: this.functionSchema.value,
      orientation: this.orientation.value,
      name: this.name.value,
      schema: this.schema.value,
      table: this.table.value,
    }
  }

  reset(trigger?: Dictionary<any>) {
    this.id = trigger?.id
    this.originalName = trigger?.name
    this.activation = { value: trigger?.activation ?? 'BEFORE' }
    this.enabledMode = { value: trigger?.enabled_mode ?? 'ORIGIN' }
    this.events = { value: trigger?.events ?? [] }
    this.functionName = { value: trigger?.function_name ?? '' }
    this.functionSchema = { value: trigger?.function_schema ?? '' }
    this.orientation = { value: trigger?.orientation ?? 'STATEMENT' }
    this.name = { value: trigger?.name ?? '' }
    this.schema = { value: trigger?.schema ?? '' }
    this.table = { value: trigger?.table ?? '' }
    this.tableId = { value: trigger?.table_id ?? '' }
  }

  update(state: Dictionary<any>) {
    this.activation = state.activation
    this.enabledMode = state.enabledMode
    this.events = state.events
    this.functionName = state.functionName
    this.functionSchema = state.functionSchema
    this.orientation = state.orientation
    this.name = state.name
    this.schema = state.schema
    this.table = state.table
    this.tableId = state.tableId
  }
}

interface ICreateTriggerStore {
  chooseFunctionFormVisible: boolean
  loading: boolean
  formState: CreateTriggerFormState
  meta: any
  selectedFunction?: Dictionary<any>[]
  tables: Dictionary<any>[]
  triggerFunctions: Dictionary<any>[]
  onFormChange: ({ key, value }: { key: string; value: any }) => void
  onSelectFunction: (id: number) => void
  setChooseFunctionFormVisible: (value: boolean) => void
  setDefaultSelectedTable: () => void
  setLoading: (value: boolean) => void
  setTables: (value: Dictionary<any>[]) => void
  setTriggerFunctions: (value: Dictionary<any>[]) => void
  validateForm: () => boolean
}

class CreateTriggerStore implements ICreateTriggerStore {
  chooseFunctionFormVisible = false
  loading = false
  formState = new CreateTriggerFormState()
  meta = null
  tables = []
  triggerFunctions = []

  constructor() {
    makeAutoObservable(this)
  }

  get selectedFunction() {
    const func = this.triggerFunctions.find(
      (x: any) =>
        x.name == this.formState.functionName.value &&
        x.schema == this.formState.functionSchema.value
    )
    return func
  }

  get title() {
    return this.formState.id ? `Edit '${this.formState.originalName}' trigger` : 'Add a new Trigger'
  }

  get isEditing() {
    return this.formState.id != undefined
  }

  setChooseFunctionFormVisible = (value: boolean) => {
    this.chooseFunctionFormVisible = value
  }

  // set first table as default selection
  setDefaultSelectedTable = () => {
    if (this.tables?.length != 0) {
      this.formState.table.value = (this.tables[0] as any).name
      this.formState.schema.value = (this.tables[0] as any).schema
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

  setTriggerFunctions = (value: Dictionary<any>[]) => {
    this.triggerFunctions = value as any
  }

  onFormChange = ({ key, value }: { key: string; value: any }) => {
    if (has(this.formState, key)) {
      const temp = (this.formState as any)[key]
      // @ts-ignore
      this.formState[key] = { ...temp, value, error: undefined }
    } else {
      // @ts-ignore
      this.formState[key] = { value }
    }
  }

  onSelectFunction = (id: number) => {
    const func = this.triggerFunctions.find((x: any) => x.id == id)
    if (func) {
      this.formState.functionName.value = (func as any).name
      this.formState.functionSchema.value = (func as any).schema
    }
  }

  validateForm = () => {
    let isValidated = true
    const _state = mapValues(this.formState, (x: { value: any }, key: string) => {
      switch (key) {
        case 'name': {
          if (isEmpty(x.value) || hasWhitespace(x.value)) {
            isValidated = false
            return { ...x, error: 'Invalid trigger name' }
          } else {
            return x
          }
        }
        case 'activation': {
          if (isEmpty(x.value)) {
            isValidated = false
            return { ...x, error: 'you have an error' }
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
        case 'tableId': {
          if (isEmpty(`${x.value}`)) {
            isValidated = false
            return { ...x, error: 'You must choose a table' }
          } else {
            return x
          }
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

const CreateTriggerContext = createContext<ICreateTriggerStore | null>(null)

type CreateTriggerProps = {
  trigger?: any
  visible: boolean
  setVisible: (value: boolean) => void
} & any

const CreateTrigger: FC<CreateTriggerProps> = ({ trigger, visible, setVisible }) => {
  const { ui, meta } = useStore()
  const _localState = useLocalObservable(() => new CreateTriggerStore())
  _localState.meta = meta as any

  // for the empty 'no tables' state link
  const router = useRouter()
  const { ref } = router.query

  useEffect(() => {
    const fetchTables = async () => {
      await (_localState!.meta as any)!.tables!.load()
      const tables = (_localState!.meta as any)!.tables.list()
      _localState.setTables(tables)
    }
    const fetchFunctions = async () => {
      await (_localState.meta as any).functions.load()
      const triggerFuncs = (_localState!.meta as any)!.functions.listTriggerFunctions()
      _localState.setTriggerFunctions(triggerFuncs)
    }

    fetchTables()
    fetchFunctions()
  }, [])

  useEffect(() => {
    if (trigger) {
      _localState.formState.reset(trigger)
    } else {
      _localState.formState.reset()
      _localState.setDefaultSelectedTable()
    }
  }, [visible, trigger])

  async function handleSubmit() {
    try {
      if (_localState.validateForm()) {
        _localState.setLoading(true)

        const body = _localState.formState.requestBody
        const response: any = _localState.isEditing
          ? await (_localState.meta as any).triggers.update(body.id, body)
          : await (_localState.meta as any).triggers.create(body)

        if (response.error) {
          ui.setNotification({
            category: 'error',
            message: `Failed to create trigger: ${
              response.error?.message ?? 'submit request failed'
            }`,
          })
          _localState.setLoading(false)
        } else {
          ui.setNotification({
            category: 'success',
            message: `${_localState.isEditing ? 'Updated' : 'Created new'} trigger called ${
              response.name
            }`,
          })
          _localState.setLoading(false)
          setVisible(!visible)
        }
      }
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Filed to create trigger: ${error.message}`,
      })
      _localState.setLoading(false)
    }
  }

  const hasPublicTables = _localState.tables.length >= 1

  return (
    <>
      <SidePanel
        wide
        visible={visible}
        onCancel={() => setVisible(!visible)}
        // @ts-ignore
        contentStyle={{ padding: 0 }}
        footerBackground={true}
        title={_localState.title}
        hideFooter={!hasPublicTables}
        className={
          _localState.chooseFunctionFormVisible
            ? 'hooks-sidepanel transform transition-all duration-300 ease-in-out mr-16'
            : 'hooks-sidepanel transform transition-all duration-300 ease-in-out mr-0'
        }
        loading={_localState.loading}
        onConfirm={handleSubmit}
      >
        {hasPublicTables ? (
          <div className="pb-8">
            <CreateTriggerContext.Provider value={_localState}>
              <div className="space-y-10 mt-4">
                {_localState.isEditing ? (
                  <div className="px-6 space-y-6">
                    <InputName />
                    <SelectEnabledMode />
                  </div>
                ) : (
                  <>
                    <div className="px-6">
                      <InputName />
                    </div>
                    <Divider light />
                    <div className="px-6 space-y-12">
                      <Typography.Title level={5}>Conditions to fire trigger</Typography.Title>
                      <ListboxTable />
                      <CheckboxEvents />
                      <ListboxActivation />
                      <SelectOrientation />
                    </div>
                    <Divider light />
                    <FunctionForm />
                  </>
                )}
              </div>
              <ChooseFunctionForm
                triggerFunctions={_localState.triggerFunctions}
                visible={_localState.chooseFunctionFormVisible}
                setVisible={_localState.setChooseFunctionFormVisible}
                onChange={(id: number) => _localState.onSelectFunction(id)}
              />
            </CreateTriggerContext.Provider>
          </div>
        ) : (
          <NoTableState />
        )}
      </SidePanel>
    </>
  )
}

const NoTableState: FC = ({}) => {
  // for the empty 'no tables' state link
  const router = useRouter()
  const { ref } = router.query

  return (
    <ProductEmptyState
      title="No public tables found"
      ctaButtonLabel="Create a new table"
      onClickCta={() => {
        router.push(`/project/${ref}/database/tables`)
      }}
    >
      <Typography.Text type="secondary">
        You will need to create a table first before you can make a trigger
      </Typography.Text>
    </ProductEmptyState>
  )
}

export default observer(CreateTrigger)

const InputName: FC = observer(({}) => {
  const _localState = useContext(CreateTriggerContext)
  return (
    <Input
      id="name"
      label="Name of trigger"
      layout="horizontal"
      placeholder="Name of trigger"
      value={_localState!.formState.name.value}
      onChange={(e) =>
        _localState!.onFormChange({
          key: 'name',
          value: e.target.value,
        })
      }
      size="small"
      error={_localState!.formState.name.error}
      descriptionText="The name is also stored as the actual postgres name of the trigger. Do not use spaces/whitespace."
    />
  )
})

const SelectEnabledMode: FC = observer(({}) => {
  const _localState = useContext(CreateTriggerContext)
  return (
    <Listbox
      id="enabled-mode"
      label="Enabled mode"
      layout="horizontal"
      value={_localState!.formState.enabledMode.value}
      onChange={(value) =>
        _localState!.onFormChange({
          key: 'enabledMode',
          value: value,
        })
      }
      size="small"
      descriptionText="Determines if a trigger should or should not fire. Can also be used to disable a trigger, but not delete it."
    >
      <Listbox.Option
        addOnBefore={({ active, selected }: any) => {
          return (
            <div className="bg-green-500 border border-green-700 shadow-sm w-3 h-3 rounded-full"></div>
          )
        }}
        value="ORIGIN"
        label="Origin"
      >
        Origin
        <span className="opacity-50 block">This is a default behaviour</span>
      </Listbox.Option>
      <Listbox.Option
        addOnBefore={({ active, selected }: any) => {
          return (
            <div className="bg-green-500 border border-green-700 shadow-sm w-3 h-3 rounded-full"></div>
          )
        }}
        value="REPLICA"
        label="Replica"
      >
        Replica
        <span className="opacity-50 block">Will only fire if the session is in “replica” mode</span>
      </Listbox.Option>
      <Listbox.Option
        addOnBefore={({ active, selected }: any) => {
          return (
            <div className="bg-green-500 border border-green-700 shadow-sm w-3 h-3 rounded-full"></div>
          )
        }}
        value="ALWAYS"
        label="Always"
      >
        Always
        <span className="opacity-50 block">
          Will fire regardless of the current replication role
        </span>
      </Listbox.Option>
      <Listbox.Option
        addOnBefore={({ active, selected }: any) => {
          return (
            <div className="bg-red-500 border border-red-700 shadow-sm w-3 h-3 rounded-full"></div>
          )
        }}
        value="DISABLED"
        label="Disabled"
      >
        Disabled
        <span className="opacity-50 block">Will not fire</span>
      </Listbox.Option>
    </Listbox>
  )
})

const SelectOrientation: FC = observer(({}) => {
  const _localState = useContext(CreateTriggerContext)
  return (
    <Listbox
      id="orientation"
      label="Orientation"
      layout="horizontal"
      value={_localState!.formState.orientation.value}
      onChange={(value) =>
        _localState!.onFormChange({
          key: 'orientation',
          value: value,
        })
      }
      size="small"
      descriptionText="Identifies whether the trigger fires once for each processed row or once for each statement"
    >
      <Listbox.Option value="ROW" label="Row">
        Row
        <span className="opacity-50 block">fires once for each processed row</span>
      </Listbox.Option>
      <Listbox.Option value="STATEMENT" label="Statement">
        Statement
        <span className="opacity-50 block">fires once for each statement</span>
      </Listbox.Option>
    </Listbox>
  )
})

const ListboxTable: FC = observer(({}) => {
  const _localState = useContext(CreateTriggerContext)

  return (
    <Listbox
      id="table"
      label="Table"
      layout="horizontal"
      value={_localState!.formState.tableId.value}
      onChange={(id) => {
        const _table = _localState!.tables.find((x) => x.id === id)
        if (_table) {
          _localState!.onFormChange({
            key: 'table',
            value: _table.name,
          })
          _localState!.onFormChange({
            key: 'schema',
            value: _table.schema,
          })
          _localState!.onFormChange({
            key: 'tableId',
            value: id,
          })
        }
      }}
      size="small"
      error={_localState!.formState.tableId.error}
      descriptionText="This is the table the trigger will watch for changes. You can only select 1 table for a trigger."
    >
      {_localState!.tables.map((x) => {
        return (
          <Listbox.Option
            id={x.id}
            key={x.id}
            value={x.id}
            label={x.name}
            addOnBefore={() => (
              <div className="bg-green-600 p-1 flex items-center justify-center rounded text-typography-body-dark ">
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
              <Divider light type="vertical" />
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

const CheckboxEvents: FC = observer(({}) => {
  const _localState = useContext(CreateTriggerContext)
  return (
    // @ts-ignore
    <Checkbox.Group
      name="events"
      label="Events"
      id="events"
      labelOptional="The type of events that will trigger your trigger"
      layout="horizontal"
      descriptionText="These are the events that are watched by the trigger, only the events selected above will fire the trigger on the table you've selected."
      size="small"
      onChange={(e) => {
        const temp = _localState!.formState.events.value
        const value = e.target.checked
          ? union(temp, [e.target.value])
          : without(temp, e.target.value)
        _localState!.onFormChange({
          key: 'events',
          value: value,
        })
      }}
      error={_localState!.formState.events.error}
    >
      <Checkbox
        value="INSERT"
        label="INSERT"
        description={'Any insert operation on the table'}
        checked={_localState!.formState.events.value.includes('INSERT')}
      />
      <Checkbox
        value="UPDATE"
        label="UPDATE"
        description="Any update operation, of any column in the table"
        checked={_localState!.formState.events.value.includes('UPDATE')}
      />
      <Checkbox
        value="DELETE"
        label="DELETE"
        description="Any deletion of a record"
        checked={_localState!.formState.events.value.includes('DELETE')}
      />
    </Checkbox.Group>
  )
})

const ListboxActivation: FC = observer(({}) => {
  const _localState = useContext(CreateTriggerContext)
  return (
    <Listbox
      id="activation"
      label="Trigger type"
      descriptionText="This determines when your Hook fires"
      onChange={(_value) => {
        _localState!.onFormChange({
          key: 'activation',
          value: _value,
        })
      }}
      value={_localState!.formState.activation.value}
      layout="horizontal"
      size="small"
      error={_localState!.formState.activation.error}
    >
      <Listbox.Option
        id={'before'}
        value={'BEFORE'}
        label={'Before the event'}
        addOnBefore={() => (
          <div className="bg-green-600  p-1 flex items-center justify-center rounded text-typography-body-dark ">
            <IconPauseCircle strokeWidth={2} size="small" />
          </div>
        )}
      >
        <div className="flex flex-col">
          <span>{'before'}</span>
          <span className="opacity-50 block">Trigger fires before the operation is attempted</span>
        </div>
      </Listbox.Option>
      <Listbox.Option
        id={'after'}
        value={'AFTER'}
        label={'After the event'}
        addOnBefore={() => (
          <div className="bg-green-600  p-1 flex items-center justify-center rounded text-typography-body-dark ">
            <IconPlayCircle strokeWidth={2} size="small" />
          </div>
        )}
      >
        <div className="flex flex-col">
          <span>{'after'}</span>
          <span className="opacity-50 block">Trigger fires after the operation has completed</span>
        </div>
      </Listbox.Option>
    </Listbox>
  )
})

const FunctionForm: FC = observer(({}) => {
  const _localState = useContext(CreateTriggerContext)

  return (
    <div className="space-y-4">
      <div className="px-6 space-y-6">
        <Typography.Title level={5}>Function to trigger</Typography.Title>
      </div>
      <div className="px-6">
        {isEmpty(_localState!.formState.functionName.value) ? (
          <FunctionEmpty />
        ) : (
          <FunctionWithArguments />
        )}
      </div>
    </div>
  )
})

const FunctionEmpty: FC = observer(({}) => {
  const _localState = useContext(CreateTriggerContext)
  return (
    <button
      type="button"
      onClick={() => _localState!.setChooseFunctionFormVisible(true)}
      className="w-full relative transition-shadow shadow-sm 
                  border-2 border-dashed dark:border-dark rounded hover:border-gray-300
                  px-6 py-4 
                  hover:bg-bg-alt-light dark:hover:bg-bg-alt-dark hover:bg-opacity-25 hover:shadow-md cursor-pointer 
                  flex space-x-3 items-center"
    >
      <FormEmptyBox
        icon={<IconTerminal size={21} strokeWidth={2} />}
        text="Choose a function to trigger"
      />
      <div className="form-info-panel__edit-icon transition-all opacity-0 absolute right-3 top-3 mt-0 bg-gray-600 w-8 h-8 rounded-full flex items-center justify-center text-white">
        <IconTool size="small" />
      </div>
    </button>
  )
})

const FunctionWithArguments: FC = observer(({}) => {
  const _localState = useContext(CreateTriggerContext)

  return (
    <>
      <button
        type="button"
        onClick={() => _localState!.setChooseFunctionFormVisible(true)}
        className="bg-bg-alt-light dark:bg-bg-alt-dark
              w-full
              form-info-panel 
              relative 
              transition-shadow shadow-sm 
              border dark:border-dark rounded hover:border-gray-300
              px-6 py-4 
              hover:bg-gray-100 hover:bg-opacity-25 hover:shadow-md cursor-pointer 
              flex space-x-3 items-center"
      >
        <div className="flex rounded-full w-8 h-8 bg-green-700 bg-opacity-10 items-center justify-center">
          <IconTerminal size="small" strokeWidth={2} />
        </div>
        <div className="flex items-center justify-center space-x-4">
          <Typography.Text type="secondary">
            {_localState!.formState.functionName.value}
          </Typography.Text>
          <div>
            <Badge>{_localState!.formState.functionSchema.value}</Badge>
          </div>
        </div>
        <div className="form-info-panel__edit-icon transition-all opacity-0 absolute right-3 top-3 mt-0 bg-gray-600 w-8 h-8 rounded-full flex items-center justify-center text-white">
          <IconTool size="small" />
        </div>
      </button>
    </>
  )
})
