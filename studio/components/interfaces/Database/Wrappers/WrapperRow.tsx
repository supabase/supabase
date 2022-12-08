import Image from 'next/image'
import { isEmpty } from 'lodash'
import { FC, useState } from 'react'
import {
  Collapsible,
  Input,
  IconCheck,
  IconChevronUp,
  Button,
  IconEdit,
  IconTrash,
  IconEye,
  IconEyeOff,
} from 'ui'

import { useStore } from 'hooks'
import { Wrapper } from './Wrappers.types'
import { makeValidateRequired } from './Wrappers.utils'
import { useFDWCreateMutation } from 'data/fdw/fdw-create-mutation'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import WrapperTableEditor from './WrapperTableEditor'

interface Props {
  wrapper: Wrapper
  isEnabled: boolean
  isOpen: boolean
  onOpen: (wrapper: string) => void
}

const WrapperRow: FC<Props> = ({ wrapper, isEnabled, isOpen, onOpen }) => {
  const getInitialFormState = () =>
    Object.fromEntries(
      wrapper.server.options.map((option) => [option.name, option.defaultValue ?? ''])
    )

  const { ui } = useStore()
  const { project } = useProjectContext()
  const { mutateAsync: createFDW } = useFDWCreateMutation()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditingTable, setIsEditingTable] = useState(false)
  const [selectedTableToEdit, setSelectedTableToEdit] = useState()

  const [formState, setFormState] = useState(getInitialFormState)
  const [newTables, setNewTables] = useState<any[]>([])
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({})

  // [Joshen TODO] Fix this logic
  const noChanges = false
  // const noChanges = JSON.stringify(getInitialFormState()) === JSON.stringify(formState)

  const onUpdateTable = (values: any) => {
    setNewTables((prev) => {
      // if the new values have tableIndex, we are editing an existing table
      if (values.tableIndex !== undefined) {
        const tableIndex = values.tableIndex
        const newTables = [...prev]
        delete values.tableIndex
        newTables[tableIndex] = values
        return newTables
      }
      return [...prev, values]
    })
    setIsEditingTable(false)
    setSelectedTableToEdit(undefined)
  }

  const onSubmit = async () => {
    const validate = makeValidateRequired(wrapper.server.options)
    const errors: any = validate(formState)
    if (!isEmpty(errors)) {
      setFormErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      await createFDW({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        wrapper,
        formState,
        newTables,
      })
      ui.setNotification({
        category: 'success',
        message: `Successfully created ${wrapper.label} foreign data wrapper`,
      })
      onOpen('')
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to create ${wrapper.label} foreign data wrapper: ${error.message}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Collapsible
        open={isOpen}
        onOpenChange={() => onOpen(wrapper.name)}
        className={[
          'bg-scale-100 dark:bg-scale-300 ',
          'hover:bg-scale-200 dark:hover:bg-scale-500',
          'data-open:bg-scale-200 dark:data-open:bg-scale-500',
          'border-scale-300',
          'dark:border-scale-500 hover:border-scale-500',
          'dark:hover:border-scale-700 data-open:border-scale-700',
          'data-open:pb-px col-span-12 mx-auto',
          '-space-y-px overflow-hidden',
          'transition border shadow hover:z-50',
          'first:rounded-tl first:rounded-tr',
          'last:rounded-bl last:rounded-br',
        ].join(' ')}
      >
        <Collapsible.Trigger asChild>
          <button
            type="button"
            className="group flex w-full items-center justify-between rounded py-3 px-6 text-scale-1200"
          >
            <div className="flex items-center gap-3">
              <IconChevronUp
                className="text-scale-800 transition data-open-parent:rotate-0 data-closed-parent:rotate-180"
                strokeWidth={2}
                width={14}
              />
              <Image
                src={wrapper.icon}
                width={20}
                height={20}
                alt={`${wrapper.name} wrapper icon`}
              />
              <span className="text-sm capitalize">{wrapper.label}</span>
            </div>
            <div className="flex items-center gap-3">
              {isEnabled ? (
                <div className="flex items-center gap-1 rounded-full border border-brand-700 bg-brand-200 py-1 px-1 text-xs text-brand-900">
                  <span className="rounded-full bg-brand-900 p-0.5 text-xs text-brand-200">
                    <IconCheck strokeWidth={2} size={12} />
                  </span>
                  <span className="px-1">Enabled</span>
                </div>
              ) : (
                <div className="rounded-md border border-scale-500 bg-scale-100 py-1 px-3 text-xs text-scale-900 dark:border-scale-700 dark:bg-scale-300">
                  Disabled
                </div>
              )}
            </div>
          </button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <div className="group border-t border-scale-500 bg-scale-100 py-6 px-6 text-scale-1200 dark:bg-scale-300">
            <div className="max-w-lg mx-auto space-y-6 my-6">
              {wrapper.server.options.map((option) => {
                const [showHidden, setShowHidden] = useState(option.hidden)
                return (
                  <Input
                    key={option.name}
                    id={option.name}
                    name={option.name}
                    label={option.label}
                    defaultValue={option.defaultValue ?? ''}
                    required={option.required ?? false}
                    value={formState[option.name]}
                    onChange={(e) => {
                      setFormState((prev) => ({ ...prev, [option.name]: e.target.value }))
                      setFormErrors((prev) => ({ ...prev, [option.name]: '' }))
                    }}
                    error={formErrors[option.name]}
                    className="input-mono"
                    type={!option.hidden ? 'text' : showHidden ? 'text' : 'password'}
                    actions={
                      option.hidden ? (
                        <div className="mr-1 flex items-center justify-center">
                          <Button
                            type="default"
                            icon={showHidden ? <IconEye /> : <IconEyeOff />}
                            onClick={() => setShowHidden(!showHidden)}
                          />
                        </div>
                      ) : null
                    }
                  />
                )
              })}
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p>Foreign Tables</p>
                    <Button type="default" onClick={() => setIsEditingTable(true)}>
                      Add table
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {newTables.length === 0 && (
                    <div className="border border-scale-600 px-4 py-4 rounded-md flex items-center justify-center">
                      <p className="text-sm text-scale-1000">
                        Add foreign tables to query from after the wrapper is enabled
                      </p>
                    </div>
                  )}
                  {newTables.map((table, i) => (
                    <div className="border border-scale-600 px-4 py-2 rounded-md space-y-1 flex items-center justify-between">
                      <div>
                        <p>{table.table_name}</p>
                        <p className="text-sm text-scale-1100">
                          {wrapper.tables[table.index].label}: {table.columns.join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="default"
                          className="px-1"
                          icon={<IconEdit />}
                          onClick={() => {
                            setIsEditingTable(true)
                            setSelectedTableToEdit({ ...table, tableIndex: i })
                          }}
                        />
                        <Button
                          type="default"
                          className="px-1"
                          icon={<IconTrash />}
                          onClick={() => {
                            setNewTables((prev) => prev.filter((_, j) => j !== i))
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-end !mt-8">
                  {/* [Joshen] Thinking if we need to add a disclaimer here that users cannot edit wrappers */}
                  <div className="flex items-center space-x-3">
                    <Button
                      type="default"
                      htmlType="reset"
                      onClick={() => {
                        onOpen('')
                        setNewTables([])
                        setFormState(getInitialFormState)
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button loading={isSubmitting} disabled={noChanges} onClick={() => onSubmit()}>
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Collapsible.Content>
      </Collapsible>
      <WrapperTableEditor
        visible={isEditingTable}
        tables={wrapper.tables}
        onCancel={() => {
          setSelectedTableToEdit(undefined)
          setIsEditingTable(false)
        }}
        onSave={onUpdateTable}
        initialData={selectedTableToEdit}
      />
    </>
  )
}

export default WrapperRow
