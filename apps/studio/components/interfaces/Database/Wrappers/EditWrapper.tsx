import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { isEmpty } from 'lodash'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

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
import Loading from 'components/ui/Loading'
import { invalidateSchemasQuery } from 'data/database/schemas-query'
import { useFDWUpdateMutation } from 'data/fdw/fdw-update-mutation'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { useCheckPermissions, useImmutableValue, useStore } from 'hooks'
import { VaultSecret } from 'types'
import {
  Button,
  Form,
  IconArrowLeft,
  IconEdit,
  IconExternalLink,
  IconLoader,
  IconTrash,
  Input,
} from 'ui'
import InputField from './InputField'
import { WRAPPERS } from './Wrappers.constants'
import {
  convertKVStringArrayToJson,
  formatWrapperTables,
  makeValidateRequired,
} from './Wrappers.utils'
import WrapperTableEditor from './WrapperTableEditor'

const EditWrapper = () => {
  const formId = 'edit-wrapper-form'
  const router = useRouter()
  const queryClient = useQueryClient()
  const { ui, vault } = useStore()
  const { ref, id } = useParams()
  const { project } = useProjectContext()

  const { data, isLoading } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const wrappers = data?.result ?? []
  const foundWrapper = wrappers.find((w) => Number(w.id) === Number(id))
  // this call to useImmutableValue should be removed if the redirect after update is also removed
  const wrapper = useImmutableValue(foundWrapper)
  const wrapperMeta = WRAPPERS.find((w) => w.handlerName === wrapper?.handler)

  const { mutate: updateFDW, isLoading: isSaving } = useFDWUpdateMutation({
    onSuccess: () => {
      ui.setNotification({
        category: 'success',
        message: `Successfully updated ${wrapperMeta?.label} foreign data wrapper`,
      })
      setWrapperTables([])

      const hasNewSchema = wrapperTables.some((table) => table.is_new_schema)
      if (hasNewSchema) invalidateSchemasQuery(queryClient, ref)

      router.push(`/project/${ref}/database/wrappers`)
    },
  })

  const [wrapperTables, setWrapperTables] = useState<any[]>([])
  const [isEditingTable, setIsEditingTable] = useState(false)
  const [selectedTableToEdit, setSelectedTableToEdit] = useState()
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({})

  const canUpdateWrapper = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'wrappers')

  const initialValues =
    wrapperMeta !== undefined
      ? {
          wrapper_name: wrapper?.name,
          server_name: wrapper?.server_name,
          ...convertKVStringArrayToJson(wrapper?.server_options ?? []),
        }
      : {}

  useEffect(() => {
    if (wrapper?.id) {
      setWrapperTables(formatWrapperTables(wrapper, wrapperMeta))
    }
  }, [wrapper?.id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loading />
      </div>
    )
  }

  if (wrapper === undefined || wrapperMeta === undefined) {
    if (isSaving) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
          <div className="flex items-center space-x-4">
            <IconLoader className="animate-spin" size={16} />
            <p className="text-sm">Updating wrapper</p>
          </div>
        </div>
      )
    } else {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
          <div className="space-y-2 flex flex-col items-center w-[400px]">
            <p>Unknown wrapper</p>
            <p className="text-sm text-center text-foreground-light">
              The wrapper ID {id} cannot be found in your project. Head back to select another
              wrapper.
            </p>
          </div>
          <Button asChild type="default">
            <Link href={`/project/${ref}/database/wrappers`}>Head back</Link>
          </Button>
        </div>
      )
    }
  }

  const onUpdateTable = (values: any) => {
    setWrapperTables((prev) => {
      // if the new values have tableIndex, we are editing an existing table
      if (values.tableIndex !== undefined) {
        const tableIndex = values.tableIndex
        const wrapperTables = [...prev]
        delete values.tableIndex
        wrapperTables[tableIndex] = values
        return wrapperTables
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
    if (wrapperTables.length === 0) errors.tables = 'Please add at least one table'
    if (!isEmpty(errors)) return setFormErrors(errors)

    updateFDW({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      wrapper,
      wrapperMeta,
      formState: { ...values, server_name: `${wrapper_name}_server` },
      tables: wrapperTables,
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
          <h3 className="mb-2 text-xl text-foreground">Edit wrapper: {wrapper.name}</h3>
          <div className="flex items-center space-x-2">
            <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
              <Link
                href="https://supabase.github.io/wrappers/stripe/"
                target="_blank"
                rel="noreferrer"
              >
                Documentation
              </Link>
            </Button>
          </div>
        </div>

        <Form id={formId} initialValues={initialValues} onSubmit={onSubmit}>
          {({ handleReset, values, initialValues, resetForm }: any) => {
            // [Alaister] although this "technically" is breaking the rules of React hooks
            // it won't error because the hooks are always rendered in the same order
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const [loadingSecrets, setLoadingSecrets] = useState(false)

            const initialTables = formatWrapperTables(wrapper?.tables ?? [])
            const hasFormChanges = JSON.stringify(values) !== JSON.stringify(initialValues)
            const hasTableChanges = JSON.stringify(initialTables) !== JSON.stringify(wrapperTables)
            const hasChanges = hasFormChanges || hasTableChanges

            const encryptedOptions = wrapperMeta.server.options.filter((option) => option.encrypted)

            // [Alaister] although this "technically" is breaking the rules of React hooks
            // it won't error because the hooks are always rendered in the same order
            // eslint-disable-next-line react-hooks/rules-of-hooks
            useEffect(() => {
              const fetchEncryptedValues = async () => {
                setLoadingSecrets(true)
                const res = await Promise.all(
                  encryptedOptions.map(async (option) => {
                    const [secret] = vault.listSecrets(
                      (secret: VaultSecret) => secret.name === `${wrapper.name}_${option.name}`
                    )
                    if (secret !== undefined) {
                      const value = await vault.fetchSecretValue(secret.id)
                      return { [option.name]: value }
                    } else {
                      return { [option.name]: '' }
                    }
                  })
                )
                const secretValues = res.reduce((a: any, b: any) => {
                  const [key] = Object.keys(b)
                  return { ...a, [key]: b[key] }
                }, {})

                resetForm({
                  values: { ...values, ...secretValues },
                  initialValues: { ...initialValues, ...secretValues },
                })
                setLoadingSecrets(false)
              }

              if (encryptedOptions.length > 0) fetchEncryptedValues()
            }, [])

            return (
              <FormPanel
                disabled={!canUpdateWrapper}
                footer={
                  <div className="flex px-8 py-4">
                    <FormActions
                      form={formId}
                      isSubmitting={isSaving}
                      hasChanges={hasChanges}
                      handleReset={() => {
                        handleReset()
                        setWrapperTables(initialTables)
                      }}
                      disabled={!canUpdateWrapper}
                      helper={
                        !canUpdateWrapper
                          ? 'You need additional permissions to edit a foreign data wrapper'
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
                        values.wrapper_name !== initialValues.wrapper_name ? (
                          <>
                            Your wrapper's server name will be updated to{' '}
                            <code className="text-xs">{values.wrapper_name}_server</code>
                          </>
                        ) : (
                          <>
                            Your wrapper's server name is{' '}
                            <code className="text-xs">{values.wrapper_name}_server</code>
                          </>
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
                        loading={option.encrypted ? loadingSecrets : false}
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
                    {wrapperTables.length === 0 ? (
                      <div className="flex justify-end translate-y-4">
                        <Button type="default" onClick={() => setIsEditingTable(true)}>
                          Add foreign table
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {wrapperTables.map((table, i) => {
                          const label = wrapperMeta.tables[table.index].label

                          return (
                            <div
                              key={`${table.schema_name}.${table.table_name}`}
                              className="flex items-center justify-between px-4 py-2 border rounded-md border-control"
                            >
                              <div>
                                <p className="text-sm">
                                  {table.schema_name}.{table.table_name}
                                </p>
                                <p className="text-sm text-foreground-light">
                                  {label}:{' '}
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
                                    setWrapperTables((prev) => prev.filter((_, j) => j !== i))
                                  }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {wrapperTables.length > 0 && (
                      <div className="flex justify-end">
                        <Button type="default" onClick={() => setIsEditingTable(true)}>
                          Add foreign table
                        </Button>
                      </div>
                    )}
                    {wrapperTables.length === 0 && formErrors.tables && (
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

export default observer(EditWrapper)
