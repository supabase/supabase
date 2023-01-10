import Link from 'next/link'
import { isEmpty } from 'lodash'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Button, Form, Input, IconArrowLeft, IconExternalLink, IconEdit, IconTrash } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useParams, useStore } from 'hooks'
import {
  FormPanel,
  FormActions,
  FormSection,
  FormsContainer,
  FormSectionLabel,
  FormSectionContent,
} from 'components/ui/Forms'
import { useFDWCreateMutation } from 'data/fdw/fdw-create-mutation'

import InputField from './InputField'
import { WRAPPERS } from './Wrappers.constants'
import WrapperTableEditor from './WrapperTableEditor'
import { makeValidateRequired } from './Wrappers.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'

const CreateWrapper = () => {
  const formId = 'create-wrapper-form'
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
      ? {
          wrapper_name: '',
          server_name: '',
          ...Object.fromEntries(
            wrapperMeta.server.options.map((option) => [option.name, option.defaultValue ?? ''])
          ),
        }
      : {}

  if (wrapperMeta === undefined) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
        <div className="space-y-2 flex flex-col items-center w-[400px]">
          <p>Unsupported wrapper type</p>
          <p className="text-sm text-center text-scale-1000">
            The wrapper type {type} not supported by the dashboard. Head back to create a different
            wrapper.
          </p>
        </div>
        <Link href={`/project/${ref}/database/wrappers`}>
          <a>
            <Button type="default">Head back</Button>
          </a>
        </Link>
      </div>
    )
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

    const { wrapper_name } = values
    if (wrapper_name.length === 0) errors.name = 'Please provide a name for your wrapper'
    if (newTables.length === 0) errors.tables = 'Please add at least one table'
    if (!isEmpty(errors)) return setFormErrors(errors)

    setSubmitting(true)
    try {
      await createFDW({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        wrapperMeta,
        formState: { ...values, server_name: `${wrapper_name}_server` },
        tables: newTables,
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
    <FormsContainer>
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
                  <div className="flex px-8 py-4">
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
                <FormSection header={<FormSectionLabel>Wrapper Configuration</FormSectionLabel>}>
                  <FormSectionContent loading={false}>
                    <Input
                      id="wrapper_name"
                      label="Wrapper Name"
                      error={formErrors.wrapper_name}
                      descriptionText={
                        (values?.wrapper_name ?? '').length > 0 ? (
                          <>
                            Your wrapper's server name will be{' '}
                            <code className="text-xs">{values.wrapper_name}_server</code>
                          </>
                        ) : (
                          ''
                        )
                      }
                    />
                  </FormSectionContent>
                </FormSection>
                <FormSection
                  header={<FormSectionLabel>{wrapperMeta.label} Configuration</FormSectionLabel>}
                >
                  <FormSectionContent loading={false}>
                    {wrapperMeta.server.options.map((option) => (
                      <InputField
                        key={option.name}
                        option={option}
                        loading={false}
                        error={formErrors[option.name]}
                      />
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
                      <div className="space-y-2">
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
                      </div>
                    )}
                    {newTables.length > 0 && (
                      <div className="flex justify-end">
                        <Button type="default" onClick={() => setIsEditingTable(true)}>
                          Add foreign table
                        </Button>
                      </div>
                    )}
                    {newTables.length === 0 && formErrors.tables && (
                      <p className="text-sm text-right text-red-900">{formErrors.tables}</p>
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
    </FormsContainer>
  )
}

export default observer(CreateWrapper)
