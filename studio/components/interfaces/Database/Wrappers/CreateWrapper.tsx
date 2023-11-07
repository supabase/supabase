import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { isEmpty } from 'lodash'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common/hooks'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import {
  FormActions,
  FormPanel,
  FormsContainer,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'
import { invalidateSchemasQuery } from 'data/database/schemas-query'
import { useFDWCreateMutation } from 'data/fdw/fdw-create-mutation'
import { useCheckPermissions, useStore } from 'hooks'
import { Button, Form, IconArrowLeft, IconEdit, IconExternalLink, IconTrash, Input } from 'ui'
import InputField from './InputField'
import { WRAPPERS } from './Wrappers.constants'
import { makeValidateRequired } from './Wrappers.utils'
import WrapperTableEditor from './WrapperTableEditor'

const CreateWrapper = () => {
  const formId = 'create-wrapper-form'
  const router = useRouter()
  const queryClient = useQueryClient()
  const { ui } = useStore()
  const { ref, type } = useParams()
  const { project } = useProjectContext()
  const canCreateWrapper = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'wrappers')

  const [newTables, setNewTables] = useState<any[]>([])
  const [isEditingTable, setIsEditingTable] = useState(false)
  const [selectedTableToEdit, setSelectedTableToEdit] = useState()
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({})

  const { mutate: createFDW, isLoading: isCreating } = useFDWCreateMutation({
    onSuccess: () => {
      ui.setNotification({
        category: 'success',
        message: `Successfully created ${wrapperMeta?.label} foreign data wrapper`,
      })
      setNewTables([])

      const hasNewSchema = newTables.some((table) => table.is_new_schema)
      if (hasNewSchema) invalidateSchemasQuery(queryClient, ref)

      router.push(`/project/${ref}/database/wrappers`)
    },
  })

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
          <p className="text-sm text-center text-foreground-light">
            The wrapper type {type} not supported by the dashboard. Head back to create a different
            wrapper.
          </p>
        </div>
        <Button asChild type="default">
          <Link href={`/project/${ref}/database/wrappers`}>Head back</Link>
        </Button>
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

  const onSubmit = async (values: any) => {
    const validate = makeValidateRequired(wrapperMeta.server.options)
    const errors: any = validate(values)

    const { wrapper_name } = values
    if (wrapper_name.length === 0) errors.name = 'Please provide a name for your wrapper'
    if (newTables.length === 0) errors.tables = 'Please add at least one table'
    if (!isEmpty(errors)) return setFormErrors(errors)

    createFDW({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      wrapperMeta,
      formState: { ...values, server_name: `${wrapper_name}_server` },
      tables: newTables,
    })
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
              <div className="flex items-center space-x-2">
                <IconArrowLeft strokeWidth={1.5} size={14} />
                <p className="text-sm">Back</p>
              </div>
            </Link>
          </div>
          <h3 className="mb-2 text-xl text-foreground">Create a {wrapperMeta.label} Wrapper</h3>
          <div className="flex items-center space-x-2">
            <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
              <Link href={wrapperMeta.docsUrl} target="_blank" rel="noreferrer">
                Documentation
              </Link>
            </Button>
          </div>
        </div>

        <Form id={formId} initialValues={initialValues} onSubmit={onSubmit}>
          {({ handleReset, values, initialValues }: any) => {
            const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)
            return (
              <FormPanel
                disabled={!canCreateWrapper}
                footer={
                  <div className="flex px-8 py-4">
                    <FormActions
                      form={formId}
                      isSubmitting={isCreating}
                      hasChanges={hasChanges}
                      handleReset={handleReset}
                      disabled={!canCreateWrapper}
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
                      <p className="text-foreground-light mt-2 w-[90%]">
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
                          <div
                            key={`${table.schema_name}.${table.table_name}`}
                            className="flex items-center justify-between px-4 py-2 border rounded-md border-control"
                          >
                            <div>
                              <p className="text-sm">
                                {table.schema_name}.{table.table_name}
                              </p>
                              <p className="text-sm text-foreground-light">
                                {wrapperMeta.tables[table.index].label}:{' '}
                                {table.columns.map((column: any) => column.name).join(', ')}
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
