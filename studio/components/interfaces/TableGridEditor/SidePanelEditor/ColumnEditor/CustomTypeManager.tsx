import InformationBox from 'components/ui/InformationBox'
import { useStore } from 'hooks'
import { isEmpty } from 'lodash'
import { FC, useState } from 'react'
import { Button, IconHelpCircle, IconPlus, IconX, Input, Listbox, SidePanel } from 'ui'
import ActionBar from '../ActionBar'



interface Props {
  visible: boolean
  closePanel: () => void
}

const CustomTypeManager: FC<Props> = ({ visible = false, closePanel }) => {
  const [CustomTypeType, setCustomTypeType] = useState("")
  const [CustomTypeName, setCustomTypeName] = useState("")
  const [errors, setErrors] = useState({})
  const [Arguments, setArguments] = useState<string[]>([])

  const { meta, ui } = useStore()

  const saveCustomType = async (resolve: () => void) => {


    if ((CustomTypeName === "" || CustomTypeName === undefined) && (CustomTypeType === "" || CustomTypeType === undefined)) {
      setErrors({type : "Please assign a base type for your new type", name : "Please assign a name for your type"})
      resolve()

    } else if (CustomTypeName === "" || CustomTypeName === undefined) {
      setErrors({name : "Please assign a name for your type"})
      resolve()
    } else if (CustomTypeType === "" || CustomTypeType === undefined) {
      setErrors({type : "Please assign a base type for your new type"})
      resolve()
    } else {
    const response = await meta.addCustomType(CustomTypeName, CustomTypeType, Arguments)
      if (response?.error) {
        ui.setNotification({ category: 'error', message: `Couldn't create a type: ${response.error.message}` })
        resolve()
        setErrors({})
      } else {
        ui.setNotification({ category: 'success', message: `New Custom Type ${CustomTypeName}` })
        setErrors({})
        resolve()
        closePanel()
      }
    }

  }

  const closePanelandResetState = () => {
    setCustomTypeName("")
    setCustomTypeType("")
    setErrors({})
    closePanel()
  }

  return (
    <SidePanel
      visible={visible}
      header={<span>Add a new custom type</span>}
      customFooter={
        <ActionBar
          backButtonLabel="Cancel"
          applyButtonLabel="Save"
          closePanel={closePanelandResetState}
          applyFunction={saveCustomType}
        />
      }
      onInteractOutside={closePanel}
    >
      <SidePanel.Content>
        <div className="flex flex-col gap-4 mt-4">

        <Input onChange={(e) => setCustomTypeName(e.target.value)} name="CustomTypeName" error={errors?.name} label="Choose a name for your new type" />
          <Listbox name="CustomTypeType" value={CustomTypeType} onChange={(value) => setCustomTypeType(value)} error={errors?.type} label="Select the base type for your new type">
            <Listbox.Option key="empty" value="" label="---">
              ---
            </Listbox.Option>
            {/* @ts-ignore */}
            <Listbox.Option key="Enumerated" value="Enumerated" label="Enumerated Type">
              <div className="flex items-center gap-2">Enumerated Type</div>
            </Listbox.Option>
          </Listbox>
          {CustomTypeType === '' ? null : CustomTypeType === 'Enumerated' ? <EnumeratedConfig Arguments={Arguments} setArguments={setArguments} /> : null}
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default CustomTypeManager

interface EnumeratedConfigProps {
  Arguments: string[], 
  setArguments: Function
}

const EnumeratedConfig: FC<EnumeratedConfigProps> = ({Arguments, setArguments}) => {

  return (
    <div className="flex flex-col gap-4">
      <InformationBox
        icon={<IconHelpCircle size="large" strokeWidth={1.5} />}
        title="What are Enumerated types?"
        description={`Enumerated Types are data types that comprise a static, ordered set of values. An example of an enum type might be the days of the week, where the table won't accept any other value.`}
        url="https://www.postgresql.org/docs/current/datatype-enum.html"
        urlLabel="Postgres Enumerated Types Documentation"
      />
      {Arguments.map((Argument, idx) => {
        return (
          <EnumeratedArgument
            setArguments={setArguments}
            Arguments={Arguments}
            index={idx}
            key={idx}
            name={Argument}
          />
        )
      })}
      <Button
        className="w-fit"
        onClick={() => setArguments([...Arguments, ""])}
        type="text"
        icon={<IconPlus size={14} strokeWidth={2} />}
      >
        Argument
      </Button>
    </div>
  )
}



interface EnumeratedArgumentProps {
  setArguments: Function
  index: number
  Arguments: string[]
  name: string
}

const EnumeratedArgument: FC<EnumeratedArgumentProps> = ({ setArguments, index, Arguments, name }) => {
  const deleteArgument = () => {
    Arguments.splice(index, 1)
    setArguments([...Arguments])
  }

  const updateState = (e :any) => {

    setArguments((prevState: string[]) => {
      const newState = prevState.map((obj, idx) => {
        if (idx === index) {
          return e.target.value;
        }

        return obj;
      });

      return newState;
    });
  };


  return (
    <div className="flex justify-between items-center">
      <Input placeholder='Argument' onChange={(e) => updateState(e)}/>
      <button type="button" className="cursor-pointer h-fit" onClick={deleteArgument}>
        <IconX strokeWidth={1} />
      </button>
    </div>
  )
}
