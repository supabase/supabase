import { has, isEmpty, mapValues, union, without } from 'lodash'
import { makeAutoObservable } from 'mobx'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { createContext, useContext, useEffect, useState } from 'react'
import SVG from 'react-inlinesvg'
import { toast } from 'sonner'
import { Badge, Button, Checkbox, Input, Listbox, SidePanel } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import FormEmptyBox from 'components/ui/FormBoxEmpty'
import NoTableState from 'components/ui/States/NoTableState'
import {
  DatabaseFunction,
  useDatabaseFunctionsQuery,
} from 'data/database-functions/database-functions-query'
import { useDatabaseTriggerCreateMutation } from 'data/database-triggers/database-trigger-create-mutation'
import { useDatabaseTriggerUpdateMutation } from 'data/database-triggers/database-trigger-update-mutation'
import { useTablesQuery } from 'data/tables/tables-query'
import { BASE_PATH } from 'lib/constants'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import type { Dictionary } from 'types'
import ChooseFunctionForm from './ChooseFunctionForm'
import { PauseCircle, PlayCircle, Terminal } from 'lucide-react'

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
  formState: CreateTriggerFormState
  meta: any
  tables: Dictionary<any>[]
  onFormChange: ({ key, value }: { key: string; value: any }) => void
  onSelectFunction: (fn: DatabaseFunction) => void
  setChooseFunctionFormVisible: (value: boolean) => void
  setDefaultSelectedTable: () => void
  setTables: (value: any[]) => void
  validateForm: () => boolean
}

class CreateTriggerStore implements ICreateTriggerStore {
  chooseFunctionFormVisible = false
  formState = new CreateTriggerFormState()
  meta = null
  tables = []
  isDirty = false

  constructor() {
    makeAutoObservable(this)
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

  setisDirty = (value: boolean) => {
    this.isDirty = value
  }

  setTables = (value: any[]) => {
    this.tables = value
      .sort((a, b) => a.schema.localeCompare(b.schema))
      .filter((a) => !EXCLUDED_SCHEMAS.includes(a.schema)) as any
    this.setDefaultSelectedTable()
  }

  onFormChange = ({ key, value }: { key: string; value: any }) => {
    this.isDirty = true
    if (has(this.formState, key)) {
      const temp = (this.formState as any)[key]
      // @ts-ignore
      this.formState[key] = { ...temp, value, error: undefined }
    } else {
      // @ts-ignore
      this.formState[key] = { value }
    }
  }

  onSelectFunction = (fn: DatabaseFunction) => {
    this.formState.functionName.value = fn.name
    this.formState.functionSchema.value = fn.schema
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

interface CreateTriggerProps {
  trigger?: any
  visible: boolean
  setVisible: (value: boolean) => void
}

const CreateTrigger = ({ trigger, visible, setVisible }: CreateTriggerProps) => {
  const { project } = useProjectContext()
  const [isClosingPanel, setIsClosingPanel] = useState(false)
  const _localState = useLocalObservable(() => new CreateTriggerStore())

  useTablesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      onSuccess(tables) {
        if (_localState.tables.length <= 0) {
          _localState.setTables(tables)
        }
      },
    }
  )

  const { data } = useDatabaseFunctionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const triggerFunctions = (data ?? []).filter((fn) => fn.return_type === 'trigger')

  const { mutate: createDatabaseTrigger, isLoading: isCreating } =
    useDatabaseTriggerCreateMutation()
  const { mutate: updateDatabaseTrigger, isLoading: isUpdating } =
    useDatabaseTriggerUpdateMutation()

  useEffect(() => {
    _localState.setisDirty(false)
    if (trigger) {
      _localState.formState.reset(trigger)
    } else {
      _localState.formState.reset()
      _localState.setDefaultSelectedTable()
    }
  }, [visible, trigger])

  async function handleSubmit() {
    if (!project) return console.error('Project is required')

    if (_localState.validateForm()) {
      const body = _localState.formState.requestBody
      if (_localState.isEditing && body.id) {
        updateDatabaseTrigger(
          {
            projectRef: project?.ref,
            connectionString: project?.connectionString,
            id: body.id,
            payload: body,
          },
          {
            onSuccess: () => {
              toast.success(`Successfully updated trigger ${body.name}`)
              setVisible(!visible)
            },
            onError: (error) => {
              toast.error(`Failed to update trigger: ${error.message}`)
            },
          }
        )
      } else {
        createDatabaseTrigger(
          {
            projectRef: project?.ref,
            connectionString: project?.connectionString,
            payload: body,
          },
          {
            onSuccess: () => {
              toast.success(`Successfully created trigger ${body.name}`)
              setVisible(!visible)
            },
            onError: (error) => {
              toast.error(`Failed to create trigger: ${error.message}`)
            },
          }
        )
      }
    }
  }

  const hasPublicTables = _localState.tables.length >= 1

  const isClosingSidePanel = () => {
    _localState.isDirty ? setIsClosingPanel(true) : setVisible(!visible)
  }

  return (
    <>
      <SidePanel
        size="large"
        visible={visible}
        onCancel={isClosingSidePanel}
        header={
          _localState.formState.id
            ? `Edit '${_localState.formState.originalName}' trigger`
            : 'Add a new Trigger'
        }
        hideFooter={!hasPublicTables}
        className={
          _localState.chooseFunctionFormVisible
            ? 'hooks-sidepanel mr-16 transform transition-all duration-300 ease-in-out'
            : 'hooks-sidepanel mr-0 transform transition-all duration-300 ease-in-out'
        }
        loading={isCreating || isUpdating}
        onConfirm={handleSubmit}
      >
        {hasPublicTables ? (
          <div>
            <CreateTriggerContext.Provider value={_localState}>
              <div className="my-6 space-y-10">
                {_localState.isEditing ? (
                  <div className="space-y-6 px-6">
                    <InputName />
                    <SelectEnabledMode />
                  </div>
                ) : (
                  <>
                    <div className="px-6">
                      <InputName />
                    </div>
                    <SidePanel.Separator />
                    <div className="space-y-12 px-6">
                      <h5>Conditions to fire trigger</h5>
                      <ListboxTable />
                      <CheckboxEvents />
                      <ListboxActivation />
                      <SelectOrientation />
                    </div>
                    <SidePanel.Separator />
                    <FunctionForm />
                  </>
                )}
              </div>
              <ChooseFunctionForm
                triggerFunctions={triggerFunctions}
                visible={_localState.chooseFunctionFormVisible}
                setVisible={_localState.setChooseFunctionFormVisible}
                onChange={(id: number) => {
                  const selectedFn = (data ?? []).find((fn) => fn.id === id)
                  if (selectedFn) _localState.onSelectFunction(selectedFn)
                }}
              />
            </CreateTriggerContext.Provider>
            <ConfirmationModal
              visible={isClosingPanel}
              title="Discard changes"
              confirmLabel="Discard"
              onCancel={() => setIsClosingPanel(false)}
              onConfirm={() => {
                setIsClosingPanel(false)
                setVisible(!visible)
              }}
            >
              <p className="text-sm text-foreground-light">
                There are unsaved changes. Are you sure you want to close the panel? Your changes
                will be lost.
              </p>
            </ConfirmationModal>
          </div>
        ) : (
          <NoTableState message="You will need to create a table first before you can make a trigger" />
        )}
      </SidePanel>
    </>
  )
}

export default observer(CreateTrigger)

const InputName = observer(({}) => {
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

const SelectEnabledMode = observer(({}) => {
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
            <div className="h-3 w-3 rounded-full border border-green-700 bg-green-900 shadow-sm"></div>
          )
        }}
        value="ORIGIN"
        label="Origin"
      >
        Origin
        <span className="block text-foreground-lighter">This is a default behavior</span>
      </Listbox.Option>
      <Listbox.Option
        addOnBefore={({ active, selected }: any) => {
          return (
            <div className="h-3 w-3 rounded-full border border-green-700 bg-green-900 shadow-sm"></div>
          )
        }}
        value="REPLICA"
        label="Replica"
      >
        Replica
        <span className="block text-foreground-lighter">
          Will only fire if the session is in “replica” mode
        </span>
      </Listbox.Option>
      <Listbox.Option
        addOnBefore={({ active, selected }: any) => {
          return (
            <div className="h-3 w-3 rounded-full border border-green-700 bg-green-900 shadow-sm"></div>
          )
        }}
        value="ALWAYS"
        label="Always"
      >
        Always
        <span className="block text-foreground-lighter">
          Will fire regardless of the current replication role
        </span>
      </Listbox.Option>
      <Listbox.Option
        addOnBefore={({ active, selected }: any) => {
          return (
            <div className="h-3 w-3 rounded-full border border-red-700 bg-red-900 shadow-sm"></div>
          )
        }}
        value="DISABLED"
        label="Disabled"
      >
        Disabled
        <span className="block text-foreground-lighter">Will not fire</span>
      </Listbox.Option>
    </Listbox>
  )
})

const SelectOrientation = observer(({}) => {
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
        <span className="block text-foreground-lighter">fires once for each processed row</span>
      </Listbox.Option>
      <Listbox.Option value="STATEMENT" label="Statement">
        Statement
        <span className="block text-foreground-lighter">fires once for each statement</span>
      </Listbox.Option>
    </Listbox>
  )
})

const ListboxTable = observer(({}) => {
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
              <div className="flex items-center justify-center rounded bg-foreground p-1 text-background">
                <SVG
                  src={`${BASE_PATH}/img/table-editor.svg`}
                  style={{ width: `16px`, height: `16px`, strokeWidth: '1px' }}
                  preProcessor={(code) =>
                    code.replace(/svg/, 'svg class="m-auto text-color-inherit"')
                  }
                />
              </div>
            )}
          >
            <div className="flex flex-row items-center space-x-1">
              <p className="text-sm text-foreground-light">{x.schema}</p>
              <p className="text-foreground">{x.name}</p>
            </div>
          </Listbox.Option>
        )
      })}
    </Listbox>
  )
})

const CheckboxEvents = observer(({}) => {
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
        label="Insert"
        description={'Any insert operation on the table'}
        checked={_localState!.formState.events.value.includes('INSERT')}
      />
      <Checkbox
        value="UPDATE"
        label="Update"
        description="Any update operation, of any column in the table"
        checked={_localState!.formState.events.value.includes('UPDATE')}
      />
      <Checkbox
        value="DELETE"
        label="Delete"
        description="Any deletion of a record"
        checked={_localState!.formState.events.value.includes('DELETE')}
      />
    </Checkbox.Group>
  )
})

const ListboxActivation = observer(({}) => {
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
          <div className="flex items-center justify-center rounded bg-foreground p-1 text-background">
            <PauseCircle strokeWidth={2} size="18" />
          </div>
        )}
      >
        <div className="flex flex-col">
          <span>{'before'}</span>
          <span className="block text-foreground-lighter">
            Trigger fires before the operation is attempted
          </span>
        </div>
      </Listbox.Option>
      <Listbox.Option
        id={'after'}
        value={'AFTER'}
        label={'After the event'}
        addOnBefore={() => (
          <div className="flex items-center justify-center rounded bg-green-1200 p-1 text-background">
            <PlayCircle strokeWidth={2} size="18" />
          </div>
        )}
      >
        <div className="flex flex-col">
          <span>{'after'}</span>
          <span className="block text-foreground-lighter">
            Trigger fires after the operation has completed
          </span>
        </div>
      </Listbox.Option>
    </Listbox>
  )
})

const FunctionForm = observer(({}) => {
  const _localState = useContext(CreateTriggerContext)

  return (
    <div className="space-y-4">
      <div className="space-y-6 px-6">
        <h5>Function to trigger</h5>
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

const FunctionEmpty = observer(({}) => {
  const _localState = useContext(CreateTriggerContext)
  return (
    <button
      type="button"
      onClick={() => _localState!.setChooseFunctionFormVisible(true)}
      className={[
        'relative w-full',
        'rounded',
        'border border-default',
        'bg-surface-200 px-5 py-1',
        'shadow-sm transition-all',
        'hover:border-strong hover:bg-overlay-hover',
      ].join(' ')}
    >
      <FormEmptyBox
        icon={<Terminal size={14} strokeWidth={2} />}
        text="Choose a function to trigger"
      />
    </button>
  )
})

const FunctionWithArguments = observer(({}) => {
  const _localState = useContext(CreateTriggerContext)

  return (
    <>
      <div
        className={[
          'relative w-full',
          'flex items-center justify-between',
          'space-x-3 px-5 py-4',
          'border border-default',
          'rounded shadow-sm transition-shadow',
        ].join(' ')}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-foreground text-background focus-within:bg-opacity-10">
            <Terminal size="18" strokeWidth={2} width={14} />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-foreground-light">{_localState!.formState.functionName.value}</p>
            <div>
              <Badge>{_localState!.formState.functionSchema.value}</Badge>
            </div>
          </div>
        </div>
        <Button type="default" onClick={() => _localState!.setChooseFunctionFormVisible(true)}>
          Change function
        </Button>
      </div>
    </>
  )
})
