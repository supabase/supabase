import { UseFormReturn } from 'react-hook-form'
import { Button } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { SingleValueFieldArray } from 'ui-patterns/form/SingleValueFieldArray/SingleValueFieldArray'

import type { SSOConfigFormSchema } from './SSOConfig'

type ProviderAttribute = 'emailMapping' | 'userNameMapping' | 'firstNameMapping' | 'lastNameMapping'

type ProviderPreset = {
  name: string
  attributeMapping: {
    keys: {
      email?: { name: string }
      user_name?: { name: string }
      first_name?: { name: string }
      last_name?: { name: string }
      name_identifier?: { name: string }
    }
  }
}

const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    name: 'GSuite',
    attributeMapping: {
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
    },
  },
  {
    name: 'Azure',
    attributeMapping: {
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
    },
  },
  {
    name: 'Okta',
    attributeMapping: {
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
    },
  },
] as const

export const AttributeMapping = ({
  form,
  emailField,
  userNameField,
  firstNameField,
  lastNameField,
}: {
  form: UseFormReturn<SSOConfigFormSchema>
  emailField: ProviderAttribute
  userNameField: ProviderAttribute
  firstNameField: ProviderAttribute
  lastNameField: ProviderAttribute
}) => {
  // Helper to apply a preset
  function applyPreset(preset: ProviderPreset) {
    const keys = preset.attributeMapping.keys
    // Set each field if present in the preset, otherwise clear
    form.setValue(emailField, [{ value: keys.email?.name ?? '' }], { shouldDirty: true })
    form.setValue(userNameField, [{ value: keys.user_name?.name ?? '' }], { shouldDirty: true })
    form.setValue(firstNameField, [{ value: keys.first_name?.name ?? '' }], { shouldDirty: true })
    form.setValue(lastNameField, [{ value: keys.last_name?.name ?? '' }], { shouldDirty: true })
  }

  return (
    <FormItemLayout
      label="Attribute mapping"
      layout="flex-row-reverse"
      description={
        <div>
          <p>Map SSO attributes to user fields</p>
          <div className="flex flex-col gap-y-2 my-2 mt-4">
            <p>Presets for supported identity providers:</p>
            <div className="flex flex-wrap items-center gap-2">
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
      <div className="grid w-full max-w-sm min-w-0 gap-3">
        <MappingFieldArray form={form} fieldName={emailField} label="email" required />
        <MappingFieldArray
          form={form}
          fieldName={userNameField}
          label="user_name"
          required={false}
        />
        <MappingFieldArray
          form={form}
          fieldName={firstNameField}
          label="first_name"
          required={false}
        />
        <MappingFieldArray
          form={form}
          fieldName={lastNameField}
          label="last_name"
          required={false}
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
  form: UseFormReturn<SSOConfigFormSchema>
  fieldName: ProviderAttribute
  label: string
  required: boolean
  placeholder?: string
}) => {
  return (
    <div className="w-full min-w-0 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-foreground-light">{label}</span>
        {!required ? <span className="text-foreground-muted">Optional</span> : null}
      </div>
      <SingleValueFieldArray
        control={form.control}
        name={fieldName}
        valueFieldName="value"
        createEmptyRow={() => ({ value: '' })}
        placeholder={placeholder ?? ''}
        addLabel="Add another"
        removeLabel={`Remove ${label} mapping`}
        minimumRows={1}
        inputAutoComplete="off"
        rowsClassName="grid gap-2 w-full"
        addButtonType="default"
        addButtonClassName="w-auto self-start justify-self-start"
      />
    </div>
  )
}
