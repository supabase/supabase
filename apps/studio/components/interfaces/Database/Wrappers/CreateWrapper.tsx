import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { isEmpty } from 'lodash'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormActions } from 'components/ui/Forms/FormActions'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { FormsContainer } from 'components/ui/Forms/FormsContainer'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { invalidateSchemasQuery } from 'data/database/schemas-query'
import { useFDWCreateMutation } from 'data/fdw/fdw-create-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { ArrowLeft, Edit, ExternalLink, Trash } from 'lucide-react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Form,
  Input,
  WarningIcon,
} from 'ui'
import InputField from './InputField'
import WrapperTableEditor from './WrapperTableEditor'
import { WRAPPERS } from './Wrappers.constants'
import { makeValidateRequired } from './Wrappers.utils'

const CreateWrapper = () => {
  const formId = 'create-wrapper-form'
  const router = useRouter()
  const queryClient = useQueryClient()
  const { ref, type } = useParams()
  const { project } = useProjectContext()
  const canCreateWrapper = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'wrappers')

  const [newTables, setNewTables] = useState<any[]>([])
  const [isEditingTable, setIsEditingTable] = useState(false)
  const [selectedTableToEdit, setSelectedTableToEdit] = useState()
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({})

  const { mutate: createFDW, isLoading: isCreating } = useFDWCreateMutation({
    onSuccess: () => {
      toast.success(`Successfully created ${wrapperMeta?.label} foreign data wrapper`)
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

  const { data } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const wrappersExtension = data?.find((ext) => ext.name === 'wrappers')

  const hasRequiredVersion =
    (wrappersExtension?.installed_version ?? '') >= (wrapperMeta?.minimumExtensionVersion ?? '')

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

  const databaseNeedsUpgrading =
    wrappersExtension?.installed_version !== wrappersExtension?.default_version

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
                <ArrowLeft strokeWidth={1.5} size={14} />
                <p className="text-sm">Back</p>
              </div>
            </Link>
          </div>
          <h3 className="mb-2 text-xl text-foreground">Create a {wrapperMeta.label} Wrapper</h3>
          <div className="flex items-center space-x-2">
            <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
              <Link href={wrapperMeta.docsUrl} target="_blank" rel="noreferrer">
                Documentation
              </Link>
            </Button>
          </div>
        </div>

        {hasRequiredVersion ? (
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
                      {wrapperMeta.server.options
                        .filter((option) => !option.hidden)
                        .map((option) => (
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
                                  Columns:{' '}
                                  {table.columns.map((column: any) => column.name).join(', ')}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  type="default"
                                  className="px-1"
                                  icon={<Edit />}
                                  onClick={() => {
                                    setIsEditingTable(true)
                                    setSelectedTableToEdit({ ...table, tableIndex: i })
                                  }}
                                />
                                <Button
                                  type="default"
                                  className="px-1"
                                  icon={<Trash />}
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
        ) : (
          <Alert_Shadcn_ variant="warning">
            <WarningIcon />
            <AlertTitle_Shadcn_>
              Your extension version is outdated for this wrapper.
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_ className="flex flex-col gap-y-2">
              <p>
                The {wrapperMeta.label} wrapper requires a minimum extension version of{' '}
                {wrapperMeta.minimumExtensionVersion}. You have version{' '}
                {wrappersExtension?.installed_version} installed. Please{' '}
                {databaseNeedsUpgrading && 'upgrade your database then '}update the extension by
                disabling and enabling the <code className="text-xs">wrappers</code> extension to
                create this wrapper.
              </p>
              <p className="text-warning">
                Warning: Before reinstalling the wrapper extension, you must first remove all
                existing wrappers. Afterward, you can recreate the wrappers.
              </p>
            </AlertDescription_Shadcn_>
            <AlertDescription_Shadcn_ className="mt-3">
              <Button asChild type="default">
                <Link
                  href={
                    databaseNeedsUpgrading
                      ? `/project/${ref}/settings/infrastructure`
                      : `/project/${ref}/database/extensions?filter=wrappers`
                  }
                >
                  {databaseNeedsUpgrading ? 'Upgrade database' : 'View wrappers extension'}
                </Link>
              </Button>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        )}
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

export default CreateWrapper
