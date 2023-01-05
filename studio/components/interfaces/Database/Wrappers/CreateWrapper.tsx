import Link from 'next/link'
import { isEmpty } from 'lodash'
import { FC, useState } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import {
  Button,
  Form,
  Input,
  IconArrowLeft,
  IconExternalLink,
  IconHelpCircle,
  IconEdit,
  IconEye,
  IconEyeOff,
  IconTrash,
} from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { ServerOption } from './Wrappers.types'
import { checkPermissions, useParams, useStore } from 'hooks'
import {
  FormPanel,
  FormActions,
  FormSection,
  FormSectionLabel,
  FormSectionContent,
} from 'components/ui/Forms'
import { useFDWCreateMutation } from 'data/fdw/fdw-create-mutation'

import { WRAPPERS } from './Wrappers.constants'
import WrapperRow from './WrapperRow'
import WrapperTableEditor from './WrapperTableEditor'
import { makeValidateRequired } from './Wrappers.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'

const InputField: FC<{ option: ServerOption; error: any }> = ({ option, error }) => {
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
        error={error}
        className={`${option.name === 'name' ? '' : 'input-mono'}`}
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

const CreateWrapper = () => {
  const formId = 'test-form'
  const router = useRouter()
  const { ui } = useStore()
  const { ref, type } = useParams()
  const { project } = useProjectContext()
  const { mutateAsync: createFDW } = useFDWCreateMutation()

  const [newTables, setNewTables] = useState<any[]>([])
  const [isEditingTable, setIsEditingTable] = useState(false)
  const [selectedTableToEdit, setSelectedTableToEdit] = useState()
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({})

  const canCreateWrapper = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'extensions')

  const wrapperMeta = WRAPPERS.find((wrapper) => wrapper.name === type)
  const initialValues =
    wrapperMeta !== undefined
      ? Object.fromEntries(
          wrapperMeta.server.options.map((option) => [option.name, option.defaultValue ?? ''])
        )
      : {}

  if (wrapperMeta === undefined) {
    return <div>Lol what?</div>
  }

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

  const onSubmit = async (values: any, { setSubmitting }: any) => {
    const validate = makeValidateRequired(wrapperMeta.server.options)

    const errors: any = validate(values)
    if (newTables.length === 0) errors.tables = 'Please add at least one table'
    if (!isEmpty(errors)) return setFormErrors(errors)

    setSubmitting(true)
    try {
      await createFDW({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        wrapper: wrapperMeta,
        formState: values,
        newTables,
      })
      ui.setNotification({
        category: 'success',
        message: `Successfully created ${wrapperMeta.label} foreign data wrapper`,
      })
      setNewTables([])
      router.push(`/project/${ref}/database/wrappers`)
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to create ${wrapperMeta.label} foreign data wrapper: ${error.message}`,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div>
        <div className="relative flex items-center justify-between mb-6">
          <div
            className={[
              'transition cursor-pointer',
              'absolute -left-20 top-1 opacity-75 hover:opacity-100',
            ].join(' ')}
          >
            <Link href={`/project/${ref}/database/wrappers`}>
              <a>
                <div className="flex items-center space-x-2">
                  <IconArrowLeft strokeWidth={1.5} size={14} />
                  <p className="text-sm">Back</p>
                </div>
              </a>
            </Link>
          </div>
          <h3 className="mb-2 text-xl text-scale-1200">Create a {wrapperMeta?.label} Wrapper</h3>
          <div className="flex items-center space-x-2">
            <Link href="https://supabase.github.io/wrappers/stripe/">
              <a target="_blank">
                <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                  Documentation
                </Button>
              </a>
            </Link>
          </div>
        </div>

        <Form id={formId} initialValues={initialValues} onSubmit={onSubmit}>
          {({ isSubmitting, handleReset, values, initialValues }: any) => {
            const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)
            return (
              <FormPanel
                disabled={!canCreateWrapper}
                footer={
                  <div className="flex py-4 px-8">
                    <FormActions
                      form={formId}
                      isSubmitting={isSubmitting}
                      hasChanges={hasChanges}
                      handleReset={handleReset}
                      helper={
                        !canCreateWrapper
                          ? 'You need additional permissions to create a foreign data wrapper'
                          : undefined
                      }
                    />
                  </div>
                }
              >
                <FormSection header={<FormSectionLabel>Server Configuration</FormSectionLabel>}>
                  <FormSectionContent loading={false}>
                    {wrapperMeta.server.options.map((option) => (
                      <InputField option={option} error={formErrors[option.name]} />
                    ))}
                  </FormSectionContent>
                </FormSection>
                <FormSection
                  header={
                    <FormSectionLabel>
                      <p>Foreign Tables</p>
                      <p className="text-scale-1000 mt-2 w-[90%]">
                        You can query your data from these foreign tables after the wrapper is
                        created
                      </p>
                    </FormSectionLabel>
                  }
                >
                  <FormSectionContent loading={false}>
                    {newTables.length === 0 ? (
                      <div className="flex justify-end translate-y-4">
                        <Button type="default" onClick={() => setIsEditingTable(true)}>
                          Add foreign table
                        </Button>
                      </div>
                    ) : (
                      <>
                        {newTables.map((table, i) => (
                          <div className="flex items-center justify-between px-4 py-2 border rounded-md border-scale-600">
                            <div>
                              <p className="text-sm">
                                {table.schema_name}.{table.table_name}
                              </p>
                              <p className="text-sm text-scale-1000">
                                {wrapperMeta.tables[table.index].label}: {table.columns.join(', ')}
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
                      </>
                    )}
                    {newTables.length > 0 && (
                      <div className="flex justify-end">
                        <Button type="default" onClick={() => setIsEditingTable(true)}>
                          Add foreign table
                        </Button>
                      </div>
                    )}
                    {newTables.length === 0 && formErrors.tables && (
                      <p className="text-sm text-red-900 text-right">{formErrors.tables}</p>
                    )}
                  </FormSectionContent>
                </FormSection>
              </FormPanel>
            )
          }}
        </Form>
      </div>

      <WrapperTableEditor
        visible={isEditingTable}
        tables={wrapperMeta.tables}
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

export default observer(CreateWrapper)
