import Link from 'next/link'
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
  IconCheckCircle,
  IconExternalLink,
  IconLoader,
  IconHelpCircle,
} from 'ui'

import { useParams, useStore } from 'hooks'
import { ServerOption, Wrapper } from './Wrappers.types'
import { makeValidateRequired } from './Wrappers.utils'
import { useFDWCreateMutation } from 'data/fdw/fdw-create-mutation'
import { useFDWDeleteMutation } from 'data/fdw/fdw-delete-mutation'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import WrapperTableEditor from './WrapperTableEditor'
import InformationBox from 'components/ui/InformationBox'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'

interface Props {
  wrapper: Wrapper
  tables: any[]
  isLoading: boolean
  isEnabled: boolean
  isOpen: boolean
  onOpen: (wrapper: string) => void
}

const InputField: FC<{
  option: ServerOption
  value: any
  error: any
  onChange: (e: any) => void
}> = ({ option, value, error, onChange }) => {
  const [showHidden, setShowHidden] = useState(!option.hidden)

  if (option.isTextArea) {
    return (
      <div className="text-area-text-sm text-area-resize-none">
        <Input.TextArea
          key={option.name}
          id={option.name}
          name={option.name}
          label={
            <div className="flex items-center space-x-2">
              <p>{option.label}</p>
              {option.urlHelper !== undefined && (
                <Link href={option.urlHelper}>
                  <a target="_blank">
                    <IconHelpCircle
                      strokeWidth={2}
                      size={14}
                      className="text-scale-1000 hover:text-scale-1200 cursor-pointer transition"
                    />
                  </a>
                </Link>
              )}
            </div>
          }
          defaultValue={option.defaultValue ?? ''}
          required={option.required ?? false}
          value={value}
          onChange={onChange}
          error={error}
          className="input-mono"
          rows={6}
        />
      </div>
    )
  } else {
    return (
      <Input
        key={option.name}
        id={option.name}
        name={option.name}
        label={
          <div className="flex items-center space-x-2">
            <p>{option.label}</p>
            {option.urlHelper !== undefined && (
              <Link href={option.urlHelper}>
                <a target="_blank">
                  <IconHelpCircle
                    strokeWidth={2}
                    size={14}
                    className="text-scale-1000 hover:text-scale-1200 cursor-pointer transition"
                  />
                </a>
              </Link>
            )}
          </div>
        }
        defaultValue={option.defaultValue ?? ''}
        required={option.required ?? false}
        value={value}
        onChange={onChange}
        error={error}
        className="input-mono"
        type={!option.hidden ? 'text' : showHidden ? 'text' : 'password'}
        actions={
          option.hidden ? (
            <div className="flex items-center justify-center mr-1">
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
  }
}

const WrapperRow: FC<Props> = ({ wrapper, tables, isLoading, isEnabled, isOpen, onOpen }) => {
  const getInitialFormState = () =>
    Object.fromEntries(
      wrapper.server.options.map((option) => [option.name, option.defaultValue ?? ''])
    )

  const { ui } = useStore()
  const { ref } = useParams()
  const { project } = useProjectContext()
  const { mutateAsync: createFDW } = useFDWCreateMutation()
  const { mutateAsync: deleteFDW } = useFDWDeleteMutation()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditingTable, setIsEditingTable] = useState(false)
  const [selectedTableToEdit, setSelectedTableToEdit] = useState()

  const [newTables, setNewTables] = useState<any[]>([])
  const [formState, setFormState] = useState(getInitialFormState)
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({})

  const noChanges = JSON.stringify(getInitialFormState()) === JSON.stringify(formState)

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

  const onSaveWrapper = async () => {
    const validate = makeValidateRequired(wrapper.server.options)
    const errors: any = validate(formState)
    if (newTables.length === 0) errors.tables = 'Please add at least one table'

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
      setNewTables([])
      setFormState(getInitialFormState)
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

  const onDeleteWrapper = () => {
    confirmAlert({
      title: `Confirm to disable ${wrapper.label} wrapper`,
      message: `Are you sure you want to disable the ${wrapper.label} wrapper? This will also remove all tables created with this wrapper.`,
      onAsyncConfirm: async () => {
        try {
          await deleteFDW({
            projectRef: project?.ref,
            connectionString: project?.connectionString,
            wrapper,
          })
          ui.setNotification({
            category: 'success',
            message: `Successfully removed ${wrapper.label} foreign data wrapper`,
          })
        } catch (error: any) {
          ui.setNotification({
            error,
            category: 'error',
            message: `Disabling ${wrapper.name} failed: ${error.message}`,
          })
        }
      },
    })
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
            className="flex items-center justify-between w-full px-6 py-3 rounded group text-scale-1200"
          >
            <div className="flex items-center gap-3">
              <IconChevronUp
                className="transition text-scale-800 data-open-parent:rotate-0 data-closed-parent:rotate-180"
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
              {isLoading ? (
                <div className="flex items-center gap-1 px-1 py-1 text-xs rounded-full">
                  <IconLoader className="animate-spin" size={18} />
                </div>
              ) : isEnabled ? (
                <div className="flex items-center gap-1 px-1 py-1 text-xs border rounded-full border-brand-700 bg-brand-200 text-brand-900">
                  <span className="rounded-full bg-brand-900 p-0.5 text-xs text-brand-200">
                    <IconCheck strokeWidth={2} size={12} />
                  </span>
                  <span className="px-1">Enabled</span>
                </div>
              ) : (
                <div className="px-3 py-1 text-xs border rounded-md border-scale-500 bg-scale-100 text-scale-900 dark:border-scale-700 dark:bg-scale-300">
                  Disabled
                </div>
              )}
            </div>
          </button>
        </Collapsible.Trigger>
        {!isLoading && (
          <>
            {isEnabled ? (
              <Collapsible.Content>
                <div className="px-6 py-6 border-t group border-scale-500 bg-scale-100 text-scale-1200 dark:bg-scale-300">
                  <div className="max-w-lg mx-auto my-6 space-y-6">
                    <InformationBox
                      hideCollapse
                      defaultVisibility
                      icon={
                        <IconCheckCircle strokeWidth={1.5} size={18} className="text-brand-900" />
                      }
                      title={`${wrapper.label} foreign data wrapper is currently enabled`}
                      description="If you'd like to edit this wrapper, you'll need to disable the wrapper first and create it again with any updated configuration."
                    />
                    <div className="space-y-2">
                      <p className="text-sm">Foreign Tables</p>
                      <div className="space-y-1">
                        {tables.map((table) => (
                          <div
                            key={table.id}
                            className="rounded border border-scale-600 bg-scale-100 py-3 dark:border-scale-500 dark:bg-scale-400 px-4 py-2 flex items-center justify-between space-x-4"
                          >
                            <div className="space-y-1">
                              <p className="text-sm">
                                {table.schema}.{table.name}
                              </p>
                              <p className="text-sm text-scale-1100">
                                Columns: {table.columns.map((c: any) => c.name).join(', ')}
                              </p>
                            </div>
                            <Link href={`/project/${ref}/editor/${table.id}`}>
                              <a>
                                <Button type="default">View table</Button>
                              </a>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-end !mt-8">
                      <div className="flex items-center space-x-3">
                        <Link href={wrapper.docsUrl}>
                          <a target="_blank">
                            <Button type="default" icon={<IconExternalLink />}>
                              Documentation
                            </Button>
                          </a>
                        </Link>
                        <Button
                          type="default"
                          loading={isSubmitting}
                          onClick={() => onDeleteWrapper()}
                        >
                          Disable wrapper
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Collapsible.Content>
            ) : (
              <Collapsible.Content>
                <div className="px-6 py-6 border-t group border-scale-500 bg-scale-100 text-scale-1200 dark:bg-scale-300">
                  <div className="max-w-lg mx-auto my-6 space-y-6">
                    {wrapper.server.options.map((option) => (
                      <InputField
                        option={option}
                        value={formState[option.name]}
                        error={formErrors[option.name]}
                        onChange={(e: any) => {
                          setFormState((prev) => ({ ...prev, [option.name]: e.target.value }))
                          setFormErrors((prev) => ({ ...prev, [option.name]: '' }))
                        }}
                      />
                    ))}
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-scale-1100">Foreign Tables</p>
                          <Button type="default" onClick={() => setIsEditingTable(true)}>
                            Add table
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {newTables.length === 0 && (
                          <div className="flex items-center justify-center px-4 py-4 border rounded-md border-scale-600">
                            <p className="text-sm text-scale-1000">
                              Add foreign tables to query from after the wrapper is enabled
                            </p>
                          </div>
                        )}
                        {newTables.map((table, i) => (
                          <div className="flex items-center justify-between px-4 py-2 border rounded-md border-scale-600">
                            <div>
                              <p className="text-sm">
                                {table.schema_name}.{table.table_name}
                              </p>
                              <p className="text-sm text-scale-1000">
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
                        {newTables.length === 0 && formErrors.tables && (
                          <p className="text-sm text-red-900">{formErrors.tables}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between !mt-8">
                        <Link href={wrapper.docsUrl}>
                          <a target="_blank">
                            <Button type="default" icon={<IconExternalLink />}>
                              Documentation
                            </Button>
                          </a>
                        </Link>
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
                          <Button
                            loading={isSubmitting}
                            disabled={noChanges}
                            onClick={() => onSaveWrapper()}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Collapsible.Content>
            )}
          </>
        )}
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
