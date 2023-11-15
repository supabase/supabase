import { Transition } from '@headlessui/react'
import { Dictionary } from 'components/grid'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import InformationBox from 'components/ui/InformationBox'
import SqlEditor from 'components/ui/SqlEditor'
import { map as lodashMap, uniqBy } from 'lodash'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { createContext, useContext, useState } from 'react'
import { Button, IconChevronDown, IconHelpCircle, IconTerminal, SidePanel } from 'ui'

interface IChooseFunctionFormStore {
  functionSchemas: string[]
  triggerFunctions: Dictionary<any>[]
}

class ChooseFunctionFormStore implements IChooseFunctionFormStore {
  triggerFunctions = []

  get functionSchemas() {
    return lodashMap(uniqBy(this.triggerFunctions, 'schema'), 'schema')
  }
}

const ChooseFunctionFormContext = createContext<IChooseFunctionFormStore | null>(null)

export interface ChooseFunctionFormProps {
  triggerFunctions: Dictionary<any>[]
  visible: boolean
  onChange: (id: number) => void
  setVisible: (value: boolean) => void
}

const ChooseFunctionForm = ({
  triggerFunctions,
  visible,
  onChange,
  setVisible,
}: ChooseFunctionFormProps) => {
  const _localState = useLocalObservable(() => new ChooseFunctionFormStore())
  _localState.triggerFunctions = triggerFunctions as any

  function selectFunction(id: number) {
    onChange(id)
    setVisible(!visible)
  }

  const hasPublicSchemaFunctions = _localState.triggerFunctions.length >= 1

  return (
    <SidePanel
      size="large"
      header="Pick a function"
      visible={visible}
      onCancel={() => setVisible(!visible)}
      className="hooks-sidepanel"
    >
      <div className="py-6">
        {hasPublicSchemaFunctions ? (
          <ChooseFunctionFormContext.Provider value={_localState}>
            <div className="space-y-6">
              <NoticeBox />
              {_localState.functionSchemas.map((schema: string) => (
                <SchemaFunctionGroup key={schema} schema={schema} selectFunction={selectFunction} />
              ))}
            </div>
          </ChooseFunctionFormContext.Provider>
        ) : (
          <NoFunctionsState />
        )}
      </div>
    </SidePanel>
  )
}

export default observer(ChooseFunctionForm)

const NoticeBox = ({}) => {
  const router = useRouter()
  const { ref } = router.query
  return (
    <div className="px-6">
      <InformationBox
        icon={<IconHelpCircle size="large" strokeWidth={1.5} />}
        title="Only functions that return a trigger will be displayed below"
        description={`You can make functions by using the Database Functions`}
        button={
          <Button
            type="default"
            onClick={() => {
              router.push(`/project/${ref}/database/functions`)
            }}
          >
            Go to Functions
          </Button>
        }
      />
    </div>
  )
}

const NoFunctionsState = ({}) => {
  // for the empty 'no tables' state link
  const router = useRouter()
  const { ref } = router.query

  return (
    <ProductEmptyState
      title="No Trigger Functions found in database"
      ctaButtonLabel="Create a trigger function"
      onClickCta={() => {
        router.push(`/project/${ref}/database/functions`)
      }}
    >
      <p className="text-sm text-foreground-light">
        You will need to create a trigger based function before you can add it to your trigger.
      </p>
    </ProductEmptyState>
  )
}

export interface SchemaFunctionGroupProps {
  schema: string
  selectFunction: (id: number) => void
}

const SchemaFunctionGroup = observer(({ schema, selectFunction }: SchemaFunctionGroupProps) => {
  const _pageState = useContext(ChooseFunctionFormContext)
  const _functions = _pageState!.triggerFunctions.filter((x) => x.schema == schema)
  return (
    <div className="space-y-4">
      <div className="sticky top-0 flex items-center space-x-1 px-6 backdrop-blur backdrop-filter">
        <h5 className="text-foreground-light">schema</h5>
        <h5>{schema}</h5>
      </div>
      <div className="space-y-0 divide-y border-t border-b dark:divide-dark dark:border-dark">
        {_functions.map((x) => (
          <Function
            id={x.id}
            key={x.id}
            completeStatement={x.complete_statement}
            name={x.name}
            onClick={selectFunction}
          />
        ))}
      </div>
    </div>
  )
})

export interface FunctionProps {
  id: number
  completeStatement: string
  name: string
  onClick: (id: number) => void
}

const Function = ({ id, completeStatement, name, onClick }: FunctionProps) => {
  const [visible, setVisible] = useState(false)
  return (
    <div
      className="cursor-pointer rounded p-3 px-6 hover:bg-background"
      onClick={() => onClick(id)}
    >
      <div className="flex items-center justify-between space-x-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center rounded bg-foreground p-1 text-background">
            <IconTerminal strokeWidth={2} size={14} />
          </div>
          <p className="mb-0 text-sm">{name}</p>
        </div>
        <Button
          type="text"
          onClick={(e) => {
            e.stopPropagation()
            setVisible(!visible)
          }}
          icon={
            <IconChevronDown className={visible ? 'rotate-180 transform' : 'rotate-0 transform'} />
          }
        >
          {visible ? 'Hide definition' : 'View definition'}
        </Button>
      </div>
      <Transition
        show={visible}
        enter="transition ease-out duration-300"
        enterFrom="transform opacity-0"
        enterTo="transform opacity-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100"
        leaveTo="transform opacity-0"
      >
        <div className="mt-4 h-64 border dark:border-dark">
          <SqlEditor defaultValue={completeStatement} readOnly={true} contextmenu={false} />
        </div>
      </Transition>
    </div>
  )
}
