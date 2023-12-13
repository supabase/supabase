import Ajv from 'ajv'
import { PropsWithChildren } from 'react'
import { AutoForm } from 'uniforms-bootstrap4'
import { JSONSchemaBridge } from 'uniforms-bridge-json-schema'

interface SchemaFormProps
  extends PropsWithChildren<{
    schema: any
    model: any
    disabled: boolean
    formRef: any
    onSubmit: any
    onChangeModel: any
  }> {}

const SchemaForm = ({
  schema,
  model,
  disabled = false,
  children,
  formRef,
  onSubmit,
  onChangeModel = () => {},
}: SchemaFormProps) => {
  const validatedSchema = new JSONSchemaBridge(schema, createValidator(schema))
  return (
    <AutoForm
      disabled={disabled}
      onChangeModel={onChangeModel}
      ref={formRef}
      schema={validatedSchema}
      onSubmit={onSubmit}
      submitField={() => <></>}
      model={model}
    >
      {children}
    </AutoForm>
  )
}
export default SchemaForm

let ajv = new Ajv({ strict: false, allErrors: true, useDefaults: true })
ajv = ajv.addFormat('absolute-url', '^(http://|https://)')

const createValidator = (schema: any) => {
  const validator = ajv.compile(schema)
  return (model: any) => {
    let cleansedModel = { ...model }
    Object.entries(cleansedModel).map(([k, v]) => {
      const isRequired = schema.required.indexOf(k) != -1
      // only do nullifyStringIfEmpty if it's a required string property
      if (typeof v === 'string' && isRequired) cleansedModel[k] = nullifyStringIfEmpty(v)
      else cleansedModel[k] = v
    })
    validator(cleansedModel)
    if (validator.errors && validator.errors.length) {
      return { details: validator.errors }
    }
  }
}

/**
 * JSON Schema doesn't support validation for empty strings.
 * We want to convert all empty strings to NULL to ensure they get validated
 */
const nullifyStringIfEmpty = (data: any) => {
  if (data.trim() === '') return null
  else return data
}
