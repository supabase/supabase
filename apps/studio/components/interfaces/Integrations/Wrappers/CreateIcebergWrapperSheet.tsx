import { isEmpty } from 'lodash'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import SchemaEditor from 'components/interfaces/TableGridEditor/SidePanelEditor/SchemaEditor'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import SchemaSelector from 'components/ui/SchemaSelector'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useFDWCreateMutation } from 'data/fdw/fdw-create-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import {
  Button,
  Form,
  Input,
  Label_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Separator,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { CreateWrapperSheetProps } from './CreateWrapperSheet'
import InputField from './InputField'
import { makeValidateRequired } from './Wrappers.utils'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'

const FORM_ID = 'create-wrapper-form'

const requiredFields: Record<Target, { name: string; required: boolean }[]> = {
  S3Tables: [
    { name: 'vault_aws_access_key_id', required: true },
    { name: 'vault_aws_secret_access_key', required: true },
    { name: 'region_name', required: true },
    { name: 'vault_aws_s3table_bucket_arn', required: true },
  ],
  R2Catalog: [
    { name: 'vault_aws_access_key_id', required: true },
    { name: 'vault_aws_secret_access_key', required: true },
    { name: 'vault_token', required: true },
    { name: 'warehouse', required: true },
    { name: 's3.endpoint', required: true },
    { name: 'catalog_uri', required: true },
  ],
  IcebergRestCatalog: [
    { name: 'vault_aws_access_key_id', required: false },
    { name: 'vault_aws_secret_access_key', required: false },
    { name: 'region_name', required: false },
    { name: 'vault_aws_s3table_bucket_arn', required: false },
    { name: 'vault_token', required: false },
    { name: 'warehouse', required: false },
    { name: 's3.endpoint', required: false },
    { name: 'catalog_uri', required: false },
  ],
} as const

type Target = 'S3Tables' | 'R2Catalog' | 'IcebergRestCatalog'

export const CreateIcebergWrapperSheet = ({
  wrapperMeta: wrapperMetaOriginal,
  isClosing,
  setIsClosing,
  onClose,
}: CreateWrapperSheetProps) => {
  const { project } = useProjectContext()
  const org = useSelectedOrganization()
  const { mutate: sendEvent } = useSendEventMutation()

  const [createSchemaSheetOpen, setCreateSchemaSheetOpen] = useState(false)
  const [selectedTarget, setSelectedTarget] = useState<Target>('S3Tables')

  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({})

  const { mutate: createFDW, isLoading: isCreating } = useFDWCreateMutation({
    onSuccess: () => {
      toast.success(`Successfully created ${wrapperMeta?.label} foreign data wrapper`)
      onClose()
    },
  })

  const wrapperMeta = useMemo(() => {
    const fields = requiredFields[selectedTarget]

    return {
      ...wrapperMetaOriginal,
      server: {
        options: wrapperMetaOriginal.server.options
          // when the target changes, change the wrapperMeta field
          .filter((option) => fields.find((field) => field.name === option.name))
          .map((option) => {
            const field = fields.find((field) => field.name === option.name)
            return {
              ...option,
              required: field?.required ?? false,
            }
          }),
      },
    }
  }, [wrapperMetaOriginal, selectedTarget])

  // prefetch schemas to make sure the schema selector is populated
  useSchemasQuery({ projectRef: project?.ref, connectionString: project?.connectionString })

  const initialValues = {
    wrapper_name: '',
    server_name: '',
    source_schema: wrapperMeta.sourceSchemaOption?.defaultValue ?? '',
    target_schema: '',
    ...Object.fromEntries(
      wrapperMeta.server.options.map((option) => [option.name, option.defaultValue ?? ''])
    ),
  }

  const onSubmit = async (values: any) => {
    const validate = makeValidateRequired(wrapperMeta.server.options)
    const errors: any = validate(values)

    if (values.source_schema.length === 0) {
      errors.source_schema = 'Please provide a source schema'
    }
    if (values.wrapper_name.length === 0) {
      errors.wrapper_name = 'Please provide a name for your wrapper'
    }
    if (!isEmpty(errors)) return setFormErrors(errors)

    createFDW({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      wrapperMeta,
      formState: { ...values, server_name: `${values.wrapper_name}_server` },
      mode: 'schema',
      tables: [],
      sourceSchema: values.source_schema,
      targetSchema: values.target_schema,
    })

    sendEvent({
      action: 'foreign_data_wrapper_created',
      properties: {
        wrapperType: wrapperMeta.label,
      },
      groups: {
        project: project?.ref ?? 'Unknown',
        organization: org?.slug ?? 'Unknown',
      },
    })
  }

  return (
    <>
      <div className="h-full" tabIndex={-1}>
        <Form
          id={FORM_ID}
          initialValues={initialValues}
          onSubmit={onSubmit}
          className="flex-grow flex flex-col h-full"
        >
          {({ values, initialValues, setFieldValue }: any) => {
            const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

            const onClosePanel = () => {
              if (hasChanges) {
                setIsClosing(true)
              } else {
                onClose()
              }
            }

            // if the form hasn't been touched and the user clicked esc or the backdrop, close the sheet
            if (!hasChanges && isClosing) {
              onClose()
            }

            return (
              <>
                <SheetHeader>
                  <SheetTitle>Create a {wrapperMeta.label} wrapper</SheetTitle>
                </SheetHeader>
                <div className="flex-grow overflow-y-auto">
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
                  <Separator />
                  <FormSection header={<FormSectionLabel>Data target</FormSectionLabel>}>
                    <FormSectionContent loading={false} className="text-sm">
                      <RadioGroupStacked
                        value={selectedTarget}
                        onValueChange={(value) => setSelectedTarget(value as Target)}
                      >
                        <RadioGroupStackedItem
                          key="S3Tables"
                          value="S3Tables"
                          label="AWS S3 Tables"
                          showIndicator={false}
                        >
                          <div className="flex gap-x-5">
                            <div className="flex flex-col">
                              <p className="text-foreground-light text-left">
                                AWS S3 storage that's optimized for analytics workloads.
                              </p>
                            </div>
                          </div>
                        </RadioGroupStackedItem>
                        <RadioGroupStackedItem
                          key="R2Catalog"
                          value="R2Catalog"
                          label="Cloudflare R2 Catalog"
                          showIndicator={false}
                        >
                          <div className="flex gap-x-5">
                            <div className="flex flex-col">
                              <p className="text-foreground-light text-left">
                                Managed Apache Iceberg built directly into your R2 bucket.
                              </p>
                            </div>
                          </div>
                        </RadioGroupStackedItem>
                        <RadioGroupStackedItem
                          key="IcebergRestCatalog"
                          value="IcebergRestCatalog"
                          label="Iceberg REST Catalog"
                          showIndicator={false}
                        >
                          <div className="flex gap-x-5">
                            <div className="flex flex-col">
                              <p className="text-foreground-light text-left">
                                Can be used with any S3-compatible storage.
                              </p>
                            </div>
                          </div>
                        </RadioGroupStackedItem>
                      </RadioGroupStacked>
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
                  <Separator />
                  <FormSection
                    header={
                      <FormSectionLabel>
                        <p>Foreign Schema</p>
                        <p className="text-foreground-light mt-2 w-[90%]">
                          All wrapper tables will be created in the specified target schema.
                        </p>
                      </FormSectionLabel>
                    }
                  >
                    <FormSectionContent loading={false}>
                      {wrapperMeta.sourceSchemaOption && (
                        <div>
                          <InputField
                            key="source_schema"
                            option={wrapperMeta.sourceSchemaOption}
                            loading={false}
                            error={formErrors['source_schema']}
                          />
                          <p className="text-foreground-lighter text-sm">
                            {wrapperMeta.sourceSchemaOption.description}
                          </p>
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <Label_Shadcn_ className="text-foreground-light">
                          Target Schema
                        </Label_Shadcn_>
                        <SchemaSelector
                          portal={false}
                          size="small"
                          selectedSchemaName={values.target_schema}
                          onSelectSchema={(schema) => setFieldValue('target_schema', schema)}
                          onSelectCreateSchema={() => setCreateSchemaSheetOpen(true)}
                        />
                        <p className="text-foreground-lighter text-sm">
                          Be careful not to use an API exposed schema.
                        </p>
                      </div>
                    </FormSectionContent>
                  </FormSection>
                </div>

                <SheetFooter>
                  <Button
                    size="tiny"
                    type="default"
                    htmlType="button"
                    onClick={onClosePanel}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="tiny"
                    type="primary"
                    form={FORM_ID}
                    htmlType="submit"
                    disabled={isCreating}
                    loading={isCreating}
                  >
                    Create wrapper
                  </Button>
                </SheetFooter>
                <SchemaEditor
                  visible={createSchemaSheetOpen}
                  closePanel={() => setCreateSchemaSheetOpen(false)}
                  onSuccess={(schema) => {
                    setFieldValue('target_schema', schema)
                    setCreateSchemaSheetOpen(false)
                  }}
                />
              </>
            )
          }}
        </Form>
      </div>
      <ConfirmationModal
        visible={isClosing}
        title="Discard changes"
        confirmLabel="Discard"
        onCancel={() => setIsClosing(false)}
        onConfirm={() => onClose()}
      >
        <p className="text-sm text-foreground-light">
          There are unsaved changes. Are you sure you want to close the panel? Your changes will be
          lost.
        </p>
      </ConfirmationModal>
    </>
  )
}
