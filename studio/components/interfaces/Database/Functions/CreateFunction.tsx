import { FC, useEffect, useContext, createContext, FormEvent, useState } from 'react'
import { isEmpty, mapValues, has, filter, keyBy, isUndefined, partition, isNull } from 'lodash'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { Button, Input, SidePanel, IconTrash, Radio, IconPlus, Toggle, Modal, Listbox } from 'ui'
import { Dictionary } from 'components/grid'
import { makeAutoObservable } from 'mobx'

import { useStore } from 'hooks'
import Panel from 'components/ui/Panel'
import SqlEditor from 'components/ui/SqlEditor'
import { POSTGRES_DATA_TYPES } from 'components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor.constants'
import ConfirmationModal from 'components/ui/ConfirmationModal'

// [Refactor] Remove local state, just use the Form component

class CreateFunctionFormState {
  id: number | undefined
  originalName: string | undefined
  // @ts-ignore
  args: { value: { name: string; type: string; error?: string }[] }
  // @ts-ignore
  behavior: { value: string; error?: string }
  // @ts-ignore
  configParams: {
    value: { name: string; value: string; error?: { name?: string; value?: string } }[]
  }
  // @ts-ignore
  definition: { value: string; error?: string }
  // @ts-ignore
  language: { value: string; error?: string }
  // @ts-ignore
  name: { value: string; error?: string }
  // @ts-ignore
  returnType: { value: string; error?: string }
  // @ts-ignore
  schema: { value: string; error?: string }
  // @ts-ignore
  securityDefiner: { value: boolean; error?: string }

  constructor() {
    makeAutoObservable(this)
    this.reset()
  }

  get requestBody() {
    return {
      id: this.id,
      name: this.name.value,
      schema: this.schema.value,
      definition: this.definition.value,
      return_type: this.returnType.value,
      language: this.language.value,
      behavior: this.behavior.value,
      security_definer: this.securityDefiner.value,
      args: this.args.value.map((x: any) => `${x.name} ${x.type}`),
      config_params: mapValues(keyBy(this.configParams.value, 'name'), 'value'),
    }
  }

  reset(func?: Dictionary<any>) {
    this.id = func?.id
    this.originalName = func?.name
    this.args = convertArgumentTypes(func?.argument_types)
    this.behavior = { value: func?.behavior ?? 'VOLATILE' }
    this.configParams = convertConfigParams(func?.config_params)
    this.definition = { value: func?.definition ?? '' }
    this.language = { value: func?.language ?? 'plpgsql' }
    this.name = { value: func?.name ?? '' }
    this.returnType = { value: func?.return_type ?? 'void' }
    this.schema = { value: func?.schema ?? 'public' }
    this.securityDefiner = { value: func?.security_definer ?? false }
  }

  update(state: Dictionary<any>) {
    this.args = state.args
    this.behavior = state.behavior
    this.configParams = state.configParams
    this.definition = state.definition
    this.language = state.language
    this.name = state.name
    this.returnType = state.returnType
    this.schema = state.schema
    this.securityDefiner = state.securityDefiner
  }
}

/**
 * convert argument_types = "a integer, b integer"
 * to args = {value: [{name:'a', type:'integer'}, {name:'b', type:'integer'}]}
 */
function convertArgumentTypes(value: string) {
  const items = value?.split(',')
  if (isEmpty(value) || !items || items?.length == 0) return { value: [] }
  const temp = items.map((x) => {
    const str = x.trim()
    const space = str.indexOf(' ')
    const name = str.slice(0, space !== 1 ? space : 0)
    const type = str.slice(space + 1)
    return { name, type }
  })
  return { value: temp }
}

/**
 * convert config_params =  {search_path: "auth, public"}
 * to {value: [{name: 'search_path', value: 'auth, public'}]}
 */
function convertConfigParams(value: Dictionary<any>) {
  const temp = []
  if (value) {
    for (var key in value) {
      temp.push({ name: key, value: value[key] })
    }
  }
  return { value: temp }
}

interface ICreateFunctionStore {
  loading: boolean
  formState: CreateFunctionFormState
  meta: any
  schemas: Dictionary<any>[]
  onFormChange: (value: { key: string; value: any }) => void
  onFormArrayChange: (value: {
    operation: 'add' | 'delete' | 'update'
    key: string
    idx?: number
    value?: any
  }) => void
  setSchemas: (value: Dictionary<any>[]) => void
  validateForm: () => boolean
}

class CreateFunctionStore implements ICreateFunctionStore {
  loading = false
  formState = new CreateFunctionFormState()
  meta = null
  schemas = []
  advancedVisible = false
  isDirty = false

  constructor() {
    makeAutoObservable(this)
  }

  get title() {
    return this.formState.id
      ? `Edit '${this.formState.originalName}' function`
      : 'Add a new function'
  }

  get isEditing() {
    return this.formState.id != undefined
  }

  toggleAdvancedVisible = () => {
    this.advancedVisible = !this.advancedVisible
  }

  setSchemas = (value: Dictionary<any>[]) => {
    this.schemas = value as any
  }

  setLoading = (value: boolean) => {
    this.loading = value
  }

  setIsDirty = (value: boolean) => {
    this.isDirty = value
  }

  onFormChange = ({ key, value }: { key: string; value: any }) => {
    this.isDirty = true
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
          // @ts-ignore
          this.formState[key].value.push(value)
        } else {
          const values = [value]
          // @ts-ignore
          this.formState[key] = { value: [value] }
        }
        break
      }
      case 'delete': {
        if (has(this.formState, key)) {
          const temp = filter(
            // @ts-ignore
            this.formState[key].value,
            (_: any, index: number) => index != idx
          ) as any
          // @ts-ignore
          this.formState[key].value = temp
        }
        break
      }
      default: {
        if (has(this.formState, key) && !isUndefined(idx)) {
          // @ts-ignore
          this.formState[key].value[idx] = value
        } else {
          // @ts-ignore
          this.formState[key] = { value: [value] }
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
            return { ...x, error: 'Invalid function name' }
          } else {
            return x
          }
        }
        case 'args': {
          const temp = x.value?.map((i: Dictionary<any>) => {
            if (isEmpty(i.name) || hasWhitespace(i.name)) {
              isValidated = false
              return { ...i, error: 'Invalid argument name' }
            } else {
              return i
            }
          })
          x.value = temp
          return x
        }
        case 'configParams': {
          const temp = x.value?.map((i: Dictionary<any>) => {
            const error: any = { name: undefined, value: undefined }
            if (isEmpty(i.name) || hasWhitespace(i.name)) {
              isValidated = false
              error.name = 'Invalid config name'
            }
            if (isEmpty(i.value)) {
              isValidated = false
              error.value = 'Missing config value'
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

const CreateFunctionContext = createContext<ICreateFunctionStore | null>(null)

type CreateFunctionProps = {
  func: any
  visible: boolean
  setVisible: (value: boolean) => void
} & any

const CreateFunction: FC<CreateFunctionProps> = ({ func, visible, setVisible }) => {
  const { ui, meta } = useStore()
  const _localState = useLocalObservable(() => new CreateFunctionStore())
  _localState.meta = meta as any

  const [isClosingPanel, setIsClosingPanel] = useState<boolean>(false)

  useEffect(() => {
    const fetchSchemas = async () => {
      await (_localState!.meta as any).schemas.load()
      const schemas = (_localState!.meta as any).schemas.list()
      _localState.setSchemas(schemas)
    }

    fetchSchemas()
  }, [])

  useEffect(() => {
    _localState.formState.reset(func)
    _localState.setIsDirty(false)
  }, [visible, func])

  async function handleSubmit() {
    try {
      if (_localState.validateForm()) {
        _localState.setLoading(true)

        const body = _localState.formState.requestBody
        const response: any = body.id
          ? await (_localState!.meta as any).functions.update(body.id, body)
          : await (_localState!.meta as any).functions.create(body)

        if (response.error) {
          ui.setNotification({
            category: 'error',
            message: `Failed to create function: ${
              response.error?.message ?? 'Submit request failed'
            }`,
          })
          _localState.setLoading(false)
        } else {
          ui.setNotification({
            category: 'success',
            message: `${_localState.isEditing ? 'Updated' : 'Created new'} function called ${
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
        message: `Failed to create function: ${error.message}`,
      })
      _localState.setLoading(false)
    }
  }

  function isClosingSidePanel() {
    _localState.isDirty ? setIsClosingPanel(true) : setVisible(!visible)
  }

  return (
    <>
      <SidePanel
        size="large"
        visible={visible}
        onCancel={isClosingSidePanel}
        header={_localState.title}
        className="hooks-sidepanel mr-0 transform transition-all duration-300 ease-in-out"
        loading={_localState.loading}
        onConfirm={handleSubmit}
      >
        <CreateFunctionContext.Provider value={_localState}>
          <div className="mt-4 space-y-10">
            {_localState.isEditing ? (
              <>
                <SidePanel.Content>
                  <div className="space-y-4">
                    <InputName />
                    <SelectSchema />
                  </div>
                </SidePanel.Content>
                <SidePanel.Separator />
                <SidePanel.Content>
                  <InputMultiArguments readonly={true} />
                </SidePanel.Content>
                <SidePanel.Separator />
                <SidePanel.Content>
                  <InputDefinition />
                </SidePanel.Content>
              </>
            ) : (
              <div className="space-y-6">
                <SidePanel.Content>
                  <InputName />
                </SidePanel.Content>
                <SidePanel.Separator />
                <SidePanel.Content>
                  <div className="space-y-4">
                    <SelectSchema />
                    <SelectReturnType />
                  </div>
                </SidePanel.Content>
                <SidePanel.Separator />
                <SidePanel.Content>
                  <InputMultiArguments />
                </SidePanel.Content>
                <SidePanel.Separator />
                <SidePanel.Content>
                  <InputDefinition />
                </SidePanel.Content>
                <SidePanel.Separator />
                <SidePanel.Content>
                  <Panel>
                    <div className={`space-y-8 rounded bg-bg-alt-light py-4 dark:bg-bg-alt-dark`}>
                      <div className={`px-6`}>
                        <Toggle
                          onChange={() => _localState.toggleAdvancedVisible()}
                          label="Show advanced settings"
                          checked={_localState.advancedVisible}
                          labelOptional="These are settings that might be familiar for postgres heavy users "
                        />
                      </div>
                      {/* advanced selections */}
                    </div>
                  </Panel>
                </SidePanel.Content>
                {_localState.advancedVisible && (
                  <>
                    <SidePanel.Content>
                      <div className="space-y-2">
                        <SelectLanguage />
                        <SelectBehavior />
                      </div>
                    </SidePanel.Content>
                    <SidePanel.Separator />
                    <SidePanel.Content>
                      <InputMultiConfigParams />
                    </SidePanel.Content>
                    <SidePanel.Separator />
                    <SidePanel.Content>
                      <RadioSecurity />
                    </SidePanel.Content>
                  </>
                )}
              </div>
            )}
          </div>
        </CreateFunctionContext.Provider>
        <ConfirmationModal
          visible={isClosingPanel}
          header="Confirm to close"
          buttonLabel="Confirm"
          onSelectCancel={() => setIsClosingPanel(false)}
          onSelectConfirm={() => {
            setIsClosingPanel(false)
            setVisible(!visible)
          }}
          children={
            <Modal.Content>
              <p className="py-4 text-sm text-scale-1100">
                There are unsaved changes. Are you sure you want to close the panel? Your changes
                will be lost.
              </p>
            </Modal.Content>
          }
        />
      </SidePanel>
    </>
  )
}

export default observer(CreateFunction)

const InputName: FC = observer(({}) => {
  const _localState = useContext(CreateFunctionContext)
  return (
    <Input
      id="name"
      label="Name of function"
      layout="horizontal"
      placeholder="Name of function"
      value={_localState!.formState.name.value}
      onChange={(e) =>
        _localState!.onFormChange({
          key: 'name',
          value: e.target.value,
        })
      }
      size="small"
      error={_localState!.formState.name.error}
      descriptionText="Name will also be used for the function name in postgres"
    />
  )
})

type InputMultiArgumentsProps = {
  readonly?: boolean
}

const InputMultiArguments: FC<InputMultiArgumentsProps> = observer(({ readonly }) => {
  const _localState = useContext(CreateFunctionContext)

  function onAddArgument() {
    _localState!.onFormArrayChange({
      key: 'args',
      value: { name: '', type: 'bool' },
      operation: 'add',
    })
  }

  return (
    <div>
      <div className="flex flex-col">
        <h5 className="text-base text-scale-1200">Arguments</h5>
        <p className="text-sm text-scale-1100">
          Arguments can be referenced in the function body using either names or numbers.
        </p>
      </div>
      <div className="space-y-2 pt-4">
        {readonly && isEmpty(_localState!.formState.args.value) && (
          <span className="text-scale-900">No argument for this function</span>
        )}
        {_localState!.formState.args.value.map(
          (x: { name: string; type: string; error?: string }, idx: number) => (
            <InputArgument
              key={`arg-${idx}`}
              idx={idx}
              name={x.name}
              type={x.type}
              error={x.error}
              readonly={readonly}
            />
          )
        )}
        {!readonly && (
          <div className="">
            <Button type="default" icon={<IconPlus />} onClick={onAddArgument} disabled={readonly}>
              Add a new argument
            </Button>
          </div>
        )}
      </div>
    </div>
  )
})

type InputArgumentProps = {
  idx: number
  name: string
  type: string
  error?: string
  readonly?: boolean
}
const InputArgument: FC<InputArgumentProps> = observer(({ idx, name, type, error, readonly }) => {
  const _localState = useContext(CreateFunctionContext)

  function onNameChange(e: FormEvent<HTMLInputElement>) {
    const _value = e.currentTarget.value
    _localState!.onFormArrayChange({
      key: 'args',
      value: { name: _value, type },
      idx,
      operation: 'update',
    })
  }

  function onTypeChange(_value: string) {
    _localState!.onFormArrayChange({
      key: 'args',
      value: { name, type: _value },
      idx,
      operation: 'update',
    })
  }

  function onDelete() {
    _localState!.onFormArrayChange({
      key: 'args',
      idx,
      operation: 'delete',
    })
  }

  return (
    <div className="flex flex-row space-x-1">
      <Input
        id={`name-${idx}`}
        className="flex-1 flex-grow"
        value={name}
        placeholder="Name of argument"
        onChange={onNameChange}
        size="small"
        error={error}
        disabled={readonly}
      />
      <Listbox
        id={`type-${idx}`}
        className="flex-1"
        value={type}
        size="small"
        onChange={onTypeChange}
        disabled={readonly}
      >
        <Listbox.Option value="integer" label="integer">
          integer
        </Listbox.Option>
        {POSTGRES_DATA_TYPES.map((x: string) => (
          <Listbox.Option key={x} value={x} label={x}>
            {x}
          </Listbox.Option>
        ))}
      </Listbox>
      {!readonly && (
        <div>
          <Button
            danger
            type="default"
            icon={<IconTrash size="tiny" />}
            onClick={onDelete}
            size="small"
          />
        </div>
      )}
    </div>
  )
})

const InputMultiConfigParams: FC = observer(({}) => {
  const _localState = useContext(CreateFunctionContext)

  function onAddArgument() {
    _localState!.onFormArrayChange({
      key: 'configParams',
      value: { name: '', value: '' },
      operation: 'add',
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h5 className="text-base text-scale-1200">Config Params</h5>
      </div>
      <div className="space-y-2 pt-4">
        {_localState!.formState.configParams.value.map(
          (
            x: { name: string; value: string; error?: { name?: string; value?: string } },
            idx: number
          ) => (
            <InputConfigParam
              key={`configParam-${idx}`}
              idx={idx}
              name={x.name}
              value={x.value}
              error={x.error}
            />
          )
        )}
      </div>
      <div className="pt-2">
        <Button type="default" icon={<IconPlus />} onClick={onAddArgument}>
          Add a new config
        </Button>
      </div>
    </div>
  )
})

type InputConfigParamProps = {
  idx: number
  name: string
  value: string
  error?: { name?: string; value?: string }
}
const InputConfigParam: FC<InputConfigParamProps> = observer(({ idx, name, value, error }) => {
  const _localState = useContext(CreateFunctionContext)

  function onNameChange(e: FormEvent<HTMLInputElement>) {
    const _value = e.currentTarget.value
    _localState!.onFormArrayChange({
      key: 'configParams',
      value: { name: _value, value },
      idx,
      operation: 'update',
    })
  }

  function onValueChange(e: FormEvent<HTMLInputElement>) {
    const _value = e.currentTarget.value
    _localState!.onFormArrayChange({
      key: 'configParams',
      value: { name, value: _value },
      idx,
      operation: 'update',
    })
  }

  function onDelete() {
    _localState!.onFormArrayChange({
      key: 'configParams',
      idx,
      operation: 'delete',
    })
  }

  return (
    <div className="flex space-x-1">
      <Input
        id={`name-${idx}`}
        className="flex-1"
        placeholder="Name of config"
        value={name}
        onChange={onNameChange}
        size="small"
        error={error?.name}
      />
      <Input
        id={`value-${idx}`}
        className="flex-1"
        placeholder="Value of config"
        value={value}
        onChange={onValueChange}
        size="small"
        error={error?.value}
      />
      <div>
        <Button
          danger
          type="default"
          icon={<IconTrash size="tiny" />}
          onClick={onDelete}
          size="small"
        />
      </div>
    </div>
  )
})

const InputDefinition: FC = observer(({}) => {
  const _localState = useContext(CreateFunctionContext)
  return (
    <div className="space-y-4">
      <div className="flex flex-col">
        <h5 className="text-base text-scale-1200">Definition</h5>
        <p className="text-sm text-scale-1100">
          The language below should be written in `{_localState!.formState.language.value}`.
        </p>
        <p className="text-sm text-scale-1100">
          Change the language in the Advanced Settings below.
        </p>
      </div>
      <div className="h-40 border dark:border-dark">
        <SqlEditor
          defaultValue={_localState!.formState.definition.value}
          onInputChange={(value: string | undefined) => {
            _localState!.onFormChange({
              key: 'definition',
              value: value,
            })
          }}
          contextmenu={false}
        />
      </div>
    </div>
  )
})

const SelectSchema: FC = observer(({}) => {
  const _localState = useContext(CreateFunctionContext)

  return (
    <Listbox
      id="schema"
      label="Schema"
      size="small"
      layout="horizontal"
      placeholder="Pick a schema"
      value={_localState!.formState.schema.value}
      descriptionText="Tables made in the table editor will be in 'public'"
      onChange={(value) => _localState!.onFormChange({ key: 'schema', value })}
    >
      {_localState!.schemas.map((x) => (
        <Listbox.Option key={x.name} label={x.name} value={x.name}>
          {x.name}
        </Listbox.Option>
      ))}
    </Listbox>
  )
})

const SelectLanguage: FC = observer(({}) => {
  const { meta } = useStore()
  const _localState = useContext(CreateFunctionContext)

  const [enabledExtensions] = partition(
    meta.extensions.list(),
    (ext: any) => !isNull(ext.installed_version)
  )

  return (
    <Listbox
      id="language"
      size="small"
      label="Language"
      layout="horizontal"
      value={_localState!.formState.language.value}
      placeholder="Pick a language"
      onChange={(value) => _localState!.onFormChange({ key: 'language', value })}
    >
      <Listbox.Option value="sql" label="sql">
        sql
      </Listbox.Option>
      {
        //map through all selected extensions that start with pl
        enabledExtensions
          .filter((ex: any) => {
            return ex.name.startsWith('pl')
          })
          .map((ex) => (
            <Listbox.Option key={ex.name} value={ex.name} label={ex.name}>
              {ex.name}
            </Listbox.Option>
          ))
      }
    </Listbox>
  )
})

const SelectReturnType: FC = observer(({}) => {
  const _localState = useContext(CreateFunctionContext)

  return (
    <Listbox
      id="returnType"
      size="small"
      label="Return type"
      layout="horizontal"
      value={_localState!.formState.returnType.value}
      onChange={(value) => _localState!.onFormChange({ key: 'returnType', value })}
    >
      <Listbox.Option value="void" label="void">
        void
      </Listbox.Option>
      <Listbox.Option value="record" label="record">
        record
      </Listbox.Option>
      <Listbox.Option value="trigger" label="trigger">
        trigger
      </Listbox.Option>
      <Listbox.Option value="integer" label="integer">
        integer
      </Listbox.Option>
      {POSTGRES_DATA_TYPES.map((x: string) => (
        <Listbox.Option key={x} value={x} label={x}>
          {x}
        </Listbox.Option>
      ))}
    </Listbox>
  )
})

const SelectBehavior: FC = observer(({}) => {
  const _localState = useContext(CreateFunctionContext)

  return (
    <Listbox
      id="behavior"
      size="small"
      label="Behavior"
      layout="horizontal"
      value={_localState!.formState.behavior.value}
      onChange={(value) => _localState!.onFormChange({ key: 'behavior', value })}
    >
      <Listbox.Option value="IMMUTABLE" label="immutable">
        immutable
      </Listbox.Option>
      <Listbox.Option value="STABLE" label="stable">
        stable
      </Listbox.Option>
      <Listbox.Option value="VOLATILE" label="volatile">
        volatile
      </Listbox.Option>
    </Listbox>
  )
})

const RadioSecurity: FC = observer(({}) => {
  const _localState = useContext(CreateFunctionContext)

  return (
    <>
      <div className="space-y-4">
        <Radio.Group
          type="cards"
          label="Type of security"
          layout="vertical"
          onChange={(event) => {
            _localState!.onFormChange({
              key: 'securityDefiner',
              value: event.target.value == 'SECURITY_DEFINER',
            })
          }}
          value={
            _localState!.formState.securityDefiner.value ? 'SECURITY_DEFINER' : 'SECURITY_INVOKER'
          }
          error={_localState!.formState.securityDefiner.error}
        >
          <Radio
            id="SECURITY_INVOKER"
            label="SECURITY INVOKER"
            value="SECURITY_INVOKER"
            checked={!_localState!.formState.securityDefiner.value}
            description="Function is to be executed with the privileges of the user that calls it."
          />
          <Radio
            id="SECURITY_DEFINER"
            label="SECURITY DEFINER"
            value="SECURITY_DEFINER"
            checked={_localState!.formState.securityDefiner.value}
            description="Function is to be executed with the privileges of the user that created it."
          />
        </Radio.Group>
      </div>
    </>
  )
})
