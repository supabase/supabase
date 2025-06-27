import { MinusCircle, Plus } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Button, FormControl_Shadcn_, Input_Shadcn_, Separator } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const PROVIDER_PRESETS = [
  {
    name: 'GSuite',
    attributeMapping: JSON.stringify({
      keys: {
        email: {
          name: 'email',
        },
        user_name: {
          name: 'user_name',
        },
        first_name: {
          name: 'first_name',
        },
        last_name: {
          name: 'last_name',
        },
      },
    }),
  },
  {
    name: 'Azure',
    attributeMapping: JSON.stringify({
      keys: {
        email: {
          name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
        },
        name_identifier: {
          name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
        },
        first_name: {
          name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
        },
        last_name: {
          name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
        },
      },
    }),
  },
  {
    name: 'Okta',
    attributeMapping: JSON.stringify({
      keys: {
        email: {
          name: 'email',
        },
      },
    }),
  },
]

const AttributeMapping = ({
  form,
  emailField,
  userNameField,
  firstNameField,
  lastNameField,
}: {
  form: ReturnType<typeof useForm<any>>
  emailField: string
  userNameField: string
  firstNameField: string
  lastNameField: string
}) => {
  // Helper to apply a preset
  function applyPreset(preset: any) {
    const keys = JSON.parse(preset.attributeMapping).keys
    // Set each field if present in the preset, otherwise clear
    form.setValue(emailField, keys.email?.name ? [{ value: keys.email.name }] : [])
    form.setValue(
      userNameField,
      keys.user_name?.name
        ? [{ value: keys.user_name.name }]
        : keys.user_name?.names
          ? keys.user_name.names.map((v: string) => ({ value: v }))
          : []
    )
    form.setValue(
      firstNameField,
      keys.first_name?.name
        ? [{ value: keys.first_name.name }]
        : keys.first_name?.names
          ? keys.first_name.names.map((v: string) => ({ value: v }))
          : []
    )
    form.setValue(
      lastNameField,
      keys.last_name?.name
        ? [{ value: keys.last_name.name }]
        : keys.last_name?.names
          ? keys.last_name.names.map((v: string) => ({ value: v }))
          : []
    )
  }

  return (
    <FormItemLayout
      label="Attribute Mapping"
      layout="flex-row-reverse"
      description={
        <div>
          <p>Map SSO attributes to user fields. Email is required.</p>
          <div className="grid gap-2 my-2 mt-24">
            <p className="text-sm">Select a provider to populate the field mapping (optional):</p>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDER_PRESETS.map((preset) => (
                <Button key={preset.name} type="outline" onClick={() => applyPreset(preset)}>
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      }
      className="gap-1"
    >
      <div className="grid gap-2 justify-start">
        <MappingFieldArray
          form={form}
          fieldName={emailField}
          label="email"
          required
          placeholder="email attribute name"
        />
        <MappingFieldArray
          form={form}
          fieldName={userNameField}
          label="user_name"
          required={false}
          placeholder="user_name attribute"
        />
        <MappingFieldArray
          form={form}
          fieldName={firstNameField}
          label="first_name"
          required={false}
          placeholder="first_name attribute"
        />
        <MappingFieldArray
          form={form}
          fieldName={lastNameField}
          label="last_name"
          required={false}
          placeholder="last_name attribute"
        />
      </div>
    </FormItemLayout>
  )
}

const MappingFieldArray = ({
  form,
  fieldName,
  label,
  required,
  placeholder,
}: {
  form: ReturnType<typeof useForm<any>>
  fieldName: string
  label: string
  required: boolean
  placeholder: string
}) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: fieldName,
  })

  // Get the value of the last input in the array
  const values = form.watch(fieldName) || []
  const lastValue = values.length > 0 ? values[values.length - 1]?.value : ''
  const isAddDisabled = !lastValue || lastValue.trim() === ''

  return (
    <div className="w-96">
      <div className="mb-1">
        {label}
        {required && <span className="text-red-600">*</span>}
      </div>
      <div className="grid gap-2 w-full">
        {fields.length === 0 ? (
          <div className="flex gap-2 items-center">
            <FormControl_Shadcn_>
              <Input_Shadcn_
                {...form.register(`${fieldName}.0.value` as const)}
                placeholder={placeholder}
                autoComplete="off"
              />
            </FormControl_Shadcn_>

            <Button
              type="text"
              size="small"
              className="w-4 h-4"
              disabled
              icon={<MinusCircle className="w-4 h-4" />}
              onClick={() => remove(0)}
            />
          </div>
        ) : (
          fields.map((field, idx) => (
            <div key={field.id} className="flex gap-2 items-center justify-start">
              <FormControl_Shadcn_>
                <Input_Shadcn_
                  {...form.register(`${fieldName}.${idx}.value` as const)}
                  placeholder={placeholder}
                  autoComplete="off"
                />
              </FormControl_Shadcn_>

              <Button
                type="text"
                size="small"
                className="h-[34px] p-1"
                disabled={fields.length === 1}
                icon={<MinusCircle />}
                onClick={() => remove(idx)}
              />
            </div>
          ))
        )}

        <Button
          type="text"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => append({ value: '' })}
          className="w-auto self-start justify-self-start"
          disabled={isAddDisabled}
        >
          Add another
        </Button>

        <Separator className="my-4" />
        {form.formState.errors[fieldName] && (
          <span className="text-red-600 text-xs mt-1">
            {form.formState.errors[fieldName].message as string}
          </span>
        )}
      </div>
    </div>
  )
}

export default AttributeMapping
