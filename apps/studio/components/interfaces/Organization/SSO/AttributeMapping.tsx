import { Plus, Trash } from 'lucide-react'
import { UseFormReturn, useFieldArray } from 'react-hook-form'

import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
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
    form.setValue(emailField, [{ value: keys.email?.name ?? '' }])
    form.setValue(userNameField, [{ value: keys.user_name?.name ?? '' }])
    form.setValue(firstNameField, [{ value: keys.first_name?.name ?? '' }])
    form.setValue(lastNameField, [{ value: keys.last_name?.name ?? '' }])
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
            <div className="flex items-center gap-x-2">
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
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: fieldName,
  })

  return (
    <div className="w-96 space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-foreground-light">{label}</span>
        {required ? <></> : <span className="text-foreground-muted">Optional</span>}
      </div>
      <div className="grid gap-2 w-full">
        {fields.map((field, idx) => (
          <div key={field.id} className="flex gap-2 items-start">
            <FormField_Shadcn_
              name={`${fieldName}.${idx}.value`}
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex-1">
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} placeholder={placeholder} autoComplete="off" />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />
            <Button
              type="default"
              icon={<Trash size={12} />}
              className="h-[34px] w-[34px]"
              disabled={fields.length <= 1}
              onClick={() => remove(idx)}
            />
          </div>
        ))}

        <Button
          type="text"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => append({ value: '' })}
          className="w-auto self-start justify-self-start"
        >
          Add another
        </Button>
      </div>
    </div>
  )
}
