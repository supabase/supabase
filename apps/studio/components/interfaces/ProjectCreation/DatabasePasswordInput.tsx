import { UseFormReturn } from 'react-hook-form'
import { FormControl_Shadcn_, FormField_Shadcn_, Input_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { DATABASE_PASSWORD_REGEX } from './ProjectCreation.constants'
import { CreateProjectForm } from './ProjectCreation.schema'
import { SpecialSymbolsCallout } from './SpecialSymbolsCallout'
import CopyButton from '@/components/ui/CopyButton'
import Panel from '@/components/ui/Panel'
import { PasswordStrengthBar } from '@/components/ui/PasswordStrengthBar'
import { passwordStrength } from '@/lib/password-strength'
import { generateStrongPassword } from '@/lib/project'

interface DatabasePasswordInputProps {
  form: UseFormReturn<CreateProjectForm>
}

const updatePasswordStrength = async (form: UseFormReturn<CreateProjectForm>, value: string) => {
  try {
    const { warning, message, strength } = await passwordStrength(value)
    form.setValue('dbPassStrength', strength, { shouldValidate: false, shouldDirty: false })
    form.setValue('dbPassStrengthMessage', message ?? '', {
      shouldValidate: false,
      shouldDirty: false,
    })
    form.setValue('dbPassStrengthWarning', warning ?? '', {
      shouldValidate: false,
      shouldDirty: false,
    })

    form.trigger('dbPass')
  } catch (error) {
    console.error(error)
  }
}

export const DatabasePasswordInput = ({ form }: DatabasePasswordInputProps) => {
  // [Refactor] DB Password could be a common component used in multiple pages with repeated logic
  async function generatePassword() {
    const password = generateStrongPassword()
    form.setValue('dbPass', password)

    updatePasswordStrength(form, password)
  }

  return (
    <Panel.Content>
      <FormField_Shadcn_
        control={form.control}
        name="dbPass"
        render={({ field }) => {
          const isInvalidDatabasePassword =
            field.value.length > 0 && !field.value.match(DATABASE_PASSWORD_REGEX)

          return (
            <FormItemLayout
              label="Database password"
              layout="horizontal"
              description={
                <>
                  {isInvalidDatabasePassword && <SpecialSymbolsCallout />}
                  <PasswordStrengthBar
                    passwordStrengthScore={form.getValues('dbPassStrength')}
                    password={field.value}
                    passwordStrengthMessage={form.getValues('dbPassStrengthMessage')}
                    generateStrongPassword={generatePassword}
                  />
                </>
              }
            >
              <div className="relative">
                <FormControl_Shadcn_>
                  <Input_Shadcn_
                    type="password"
                    placeholder="Type in a strong password"
                    {...field}
                    autoComplete="off"
                    className={field.value.length > 0 ? 'pr-10' : undefined}
                    onChange={async (event) => {
                      const newValue = event.target.value
                      field.onChange(event)

                      updatePasswordStrength(form, newValue)
                    }}
                  />
                </FormControl_Shadcn_>
                {field.value.length > 0 && (
                  <CopyButton
                    iconOnly
                    size="tiny"
                    type="default"
                    title="Copy password"
                    aria-label="Copy password"
                    text={field.value}
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                  />
                )}
              </div>
            </FormItemLayout>
          )
        }}
      />
    </Panel.Content>
  )
}
