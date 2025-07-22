import { isEmpty } from 'lodash'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { useSchemaCreateMutation } from 'data/database/schema-create-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useFDWCreateMutation } from 'data/fdw/fdw-create-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import {
  Button,
  Form,
  Input,
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

const FORM_ID = 'create-wrapper-form'

const requiredFields: Record<Target, { name: string; required: boolean }[]> = {
  s3: [
    { name: 'vault_key_id', required: true },
    { name: 'vault_secret', required: true },
    { name: 'region', required: false },
    { name: 'endpoint', required: false },
    { name: 'session_token', required: false },
    { name: 'url_compatibility_mode', required: false },
    { name: 'url_style', required: false },
    { name: 'use_ssl', required: false },
    { name: 'kms_key_id', required: false },
  ],
  s3_tables: [
    { name: 'vault_key_id', required: true },
    { name: 'vault_secret', required: true },
    { name: 's3_tables_arn', required: true },
    { name: 'region', required: false },
  ],
  r2: [
    { name: 'vault_key_id', required: true },
    { name: 'vault_secret', required: true },
    { name: 'account_id', required: true },
  ],
  r2_catalog: [
    { name: 'vault_token', required: true },
    { name: 'warehouse', required: true },
    { name: 'catalog_uri', required: true },
  ],
  polaris: [
    { name: 'vault_client_id', required: true },
    { name: 'vault_client_secret', required: true },
    { name: 'warehouse', required: true },
    { name: 'catalog_uri', required: true },
  ],
  lakekeeper: [
    { name: 'vault_client_id', required: true },
    { name: 'vault_client_secret', required: true },
    { name: 'oauth2_scope', required: true },
    { name: 'oauth2_server_uri', required: true },
    { name: 'warehouse', required: true },
    { name: 'catalog_uri', required: true },
  ],
  iceberg: [
    { name: 'vault_client_id', required: false },
    { name: 'vault_client_secret', required: false },
    { name: 'vault_token', required: false },
    { name: 'oauth2_scope', required: false },
    { name: 'oauth2_server_uri', required: false },
    { name: 'warehouse', required: true },
    { name: 'catalog_uri', required: true },
  ],
} as const

type Target = 's3' | 's3_tables' | 'r2' | 'r2_catalog' | 'polaris' | 'lakekeeper' | 'iceberg'

export const CreateDuckDbWrapperSheet = ({
  wrapperMeta: wrapperMetaOriginal,
  isClosing,
  setIsClosing,
  onClose,
}: CreateWrapperSheetProps) => {
  const { project } = useProjectContext()
  const { data: org } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()

  const [selectedTarget, setSelectedTarget] = useState<Target>('s3')

  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({})

  const { mutateAsync: createFDW, isLoading: isCreatingWrapper } = useFDWCreateMutation({
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

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref!,
    connectionString: project?.connectionString,
  })

  const initialValues = {
    wrapper_name: '',
    server_name: '',
    source_schema: wrapperMeta.sourceSchemaOption?.defaultValue ?? '',
    target_schema: '',
    ...Object.fromEntries(
      wrapperMeta.server.options.map((option) => [option.name, option.defaultValue ?? ''])
    ),
  }

  const { mutateAsync: createSchema, isLoading: isCreatingSchema } = useSchemaCreateMutation()

  const onSubmit = async (values: any) => {
    const validate = makeValidateRequired(wrapperMeta.server.options)
    const errors: any = validate(values)

    if (selectedTarget === 's3') {
      if (
        values.url_compatibility_mode &&
        values.url_compatibility_mode !== 'true' &&
        values.url_compatibility_mode !== 'false'
      ) {
        errors.url_compatibility_mode = 'Please set it true or false'
      }

      if (values.url_style && values.url_style !== 'vhost' && values.url_style !== 'path') {
        errors.url_style = 'Please set it vhost or path'
      }

      if (values.use_ssl && values.use_ssl !== 'true' && values.use_ssl !== 'false') {
        errors.use_ssl = 'Please set it true or false'
      }
    }

    if (values.source_schema.length === 0) {
      errors.source_schema = 'Please provide a namespace name'
    }
    if (values.wrapper_name.length === 0) {
      errors.wrapper_name = 'Please provide a name for your wrapper'
    }

    if (values.target_schema.length === 0) {
      errors.target_schema = 'Please provide an unique target schema'
    }
    const foundSchema = schemas?.find((s) => s.name === values.target_schema)
    if (foundSchema) {
      errors.target_schema = 'This schema already exists. Please specify a unique schema name.'
    }

    setFormErrors(errors)
    if (!isEmpty(errors)) {
      return
    }

    try {
      await createSchema({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        name: values.target_schema,
      })

      await createFDW({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        wrapperMeta,
        formState: {
          type: selectedTarget,
          ...values,
          server_name: `${values.wrapper_name}_server`,
        },
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
    } catch (error) {
      console.error(error)
      // The error will be handled by the mutation onError callback (toast.error)
    }
  }

  const isLoading = isCreatingWrapper || isCreatingSchema

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
                          key="s3"
                          value="s3"
                          label="AWS S3"
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
                          key="s3_tables"
                          value="s3_tables"
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
                          key="r2"
                          value="r2"
                          label="Cloudflare R2"
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
                          key="r2_catalog"
                          value="r2_catalog"
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
                          key="polaris"
                          value="polaris"
                          label="Polaris"
                          showIndicator={false}
                        >
                          <div className="flex gap-x-5">
                            <div className="flex flex-col">
                              <p className="text-foreground-light text-left">
                                Something about Polaris.
                              </p>
                            </div>
                          </div>
                        </RadioGroupStackedItem>
                        <RadioGroupStackedItem
                          key="lakekeeper"
                          value="lakekeeper"
                          label="Lakekeeper"
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
                        <RadioGroupStackedItem
                          key="iceberg"
                          value="iceberg"
                          label="Iceberg"
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
                        <InputField
                          key="target_schema"
                          option={{
                            name: 'target_schema',
                            label: 'Target Schema',
                            required: true,
                            encrypted: false,
                            secureEntry: false,
                          }}
                          loading={false}
                          error={formErrors['target_schema']}
                        />
                        <p className="text-foreground-lighter text-sm">
                          A new schema will be created. All wrapper tables will be created in the
                          specified target schema.
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
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="tiny"
                    type="primary"
                    form={FORM_ID}
                    htmlType="submit"
                    loading={isLoading}
                  >
                    Create wrapper
                  </Button>
                </SheetFooter>
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
