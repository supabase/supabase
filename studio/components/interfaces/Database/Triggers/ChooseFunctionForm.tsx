import { FC, createContext, useContext, useState } from 'react'
import { useRouter } from 'next/router'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { uniqBy, map as lodashMap } from 'lodash'
import { Transition } from '@headlessui/react'
import { Button, IconChevronDown, IconHelpCircle, IconTerminal, SidePanel } from 'ui'
import { Dictionary } from 'components/grid'
import SqlEditor from 'components/ui/SqlEditor'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import InformationBox from 'components/ui/InformationBox'

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

type ChooseFunctionFormProps = {
  triggerFunctions: Dictionary<any>[]
  visible: boolean
  onChange: (id: number) => void
  setVisible: (value: boolean) => void
}

const ChooseFunctionForm: FC<ChooseFunctionFormProps> = ({
  triggerFunctions,
  visible,
  onChange,
  setVisible,
}) => {
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
    </SidePanel>
  )
}

export default observer(ChooseFunctionForm)

const NoticeBox: FC = ({}) => {
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
            type="secondary"
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

const NoFunctionsState: FC = ({}) => {
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
      <p className="text-sm text-scale-1100">
        You will need to create a trigger based function before you can add it to your trigger.
      </p>
    </ProductEmptyState>
  )
}

type SchemaFunctionGroupProps = {
  schema: string
  selectFunction: (id: number) => void
}

const SchemaFunctionGroup: FC<SchemaFunctionGroupProps> = observer(({ schema, selectFunction }) => {
  const _pageState = useContext(ChooseFunctionFormContext)
  const _functions = _pageState!.triggerFunctions.filter((x) => x.schema == schema)
  return (
    <div className="space-y-4">
      <div className="sticky top-0 flex items-center space-x-1 px-6 backdrop-blur backdrop-filter">
        <h5 className="text-scale-1000">schema</h5>
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

type FunctionProps = {
  id: number
  completeStatement: string
  name: string
  onClick: (id: number) => void
}

const Function: FC<FunctionProps> = ({ id, completeStatement, name, onClick }) => {
  const [visible, setVisible] = useState(false)
  return (
    <div
      className="cursor-pointer rounded p-3 px-6 hover:bg-bg-alt-light dark:hover:bg-bg-alt-dark"
      onClick={() => onClick(id)}
    >
      <div className="flex items-center justify-between space-x-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center rounded bg-scale-1200 p-1 text-scale-100 ">
            <IconTerminal strokeWidth={2} size={14} />
          </div>
          <h5 className="mb-0">{name}</h5>
        </div>
        <Button
          type="text"
          onClick={(e) => {
            e.stopPropagation()
            setVisible(!visible)
          }}
          icon={
            <IconChevronDown className={visible ? 'rotate-0 transform' : 'rotate-180 transform'} />
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
