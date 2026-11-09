import { useId } from 'react'
import { Control, FieldPath, FieldValues, useFormContext, useWatch } from 'react-hook-form'
import { Checkbox, FormControl, FormField, Switch } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import {
  getAuthorizationPreviewExplanation,
  getResultingGrantDescription,
} from './Authorization.utils'
import { FormSchemaWithOAuthAppScopedGrants } from './PublishAppSidePanel.utils'

interface OneTimeWithConfirmToggleProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  confirmedName: FieldPath<TFieldValues>
  label: string
  description: string
  warningBody: string
}

export const OneTimeWithConfirmToggle = <TFieldValues extends FieldValues>({
  control,
  name,
  confirmedName,
  label,
  description,
  warningBody,
}: OneTimeWithConfirmToggleProps<TFieldValues>) => {
  const checkboxId = useId()
  const { getFieldState } = useFormContext()
  const isNewlyEnabled = useWatch({
    control,
    name,
    compute: (value) => {
      const fieldState = getFieldState(name)
      return fieldState.isDirty && !!value
    },
  })

  return (
    <div className="space-y-3">
      <FormItemLayout
        layout="flex-row-reverse"
        className="justify-between"
        label={label}
        description={description}
      >
        <FormField
          control={control}
          name={name}
          render={({ field, fieldState }) => (
            <FormControl>
              <Switch
                ref={field.ref}
                // TS can't know this field value is a boolean
                checked={!!field.value}
                disabled={!!field.value && !fieldState.isDirty}
                aria-label={label}
                onCheckedChange={(checked) => {
                  field.onChange(checked)
                }}
              />
            </FormControl>
          )}
        />
      </FormItemLayout>
      {isNewlyEnabled && (
        <Admonition
          type="warning"
          layout="vertical"
          title="This can't be turned off after you save"
        >
          <p>{warningBody}</p>
          <FormField
            control={control}
            name={confirmedName}
            render={({ field, fieldState }) => (
              <>
                <label htmlFor={checkboxId} className="flex items-start gap-2 pt-2 cursor-pointer">
                  <Checkbox
                    ref={field.ref}
                    id={checkboxId}
                    // TS can't know this field value is a boolean
                    checked={!!field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                    className="mt-0.5"
                    aria-describedby={fieldState.invalid ? `${confirmedName}_error` : undefined}
                  />
                  <span className="text-sm text-foreground">
                    I understand this is permanent. I can test it on a duplicate app first
                  </span>
                </label>
                {fieldState.invalid ? (
                  <p className="text-destructive" id={`${confirmedName}_error`}>
                    {fieldState.error?.message}
                  </p>
                ) : null}
              </>
            )}
          />
        </Admonition>
      )}
    </div>
  )
}

export interface AuthorizationSectionProps {
  control: Control<FormSchemaWithOAuthAppScopedGrants>
}

export const AuthorizationSection = ({ control }: AuthorizationSectionProps) => {
  const { explanation, resultingGrant } = useWatch({
    control,
    name: ['member_bound_grant', 'project_scoping'],
    compute: ([memberBoundGrant, projectScoping]) => ({
      explanation: getAuthorizationPreviewExplanation(memberBoundGrant, projectScoping),
      resultingGrant: getResultingGrantDescription(memberBoundGrant, projectScoping),
    }),
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col">
        <span className="text-sm text-foreground">Authorization</span>
        <span className="text-sm text-foreground-light">
          How your app is granted access when someone connects it
        </span>
      </div>

      <OneTimeWithConfirmToggle
        control={control}
        label="Use the permissions of the person who connects"
        description="Each member who connects gets their own grant, limited to what they can already do. When off, an owner approves one organization-wide grant."
        warningBody="Existing connections keep working. Only new connections will use per-member grants."
        name="member_bound_grant"
        confirmedName="member_bound_grant_confirmed"
      />

      <OneTimeWithConfirmToggle
        control={control}
        label="Ask for specific projects"
        description="Users pick which projects your app can reach. Requests to other projects return 403. When off, your app reaches every project in the organization."
        warningBody="Make sure your app reads the returned scopes and handles denied requests before you turn this on."
        name="project_scoping"
        confirmedName="project_scoping_confirmed"
      />

      <Admonition
        type="note"
        layout="vertical"
        title="What your app users will see when they connect"
      >
        <p>
          An organization owner approves your app once. It can then reach every project in their
          organization.
        </p>
        {explanation && <p>{explanation}</p>}
        <p>
          <span className="text-foreground-lighter">Resulting grant: </span>
          <span className="text-foreground-light">{resultingGrant}</span>
        </p>
      </Admonition>
    </div>
  )
}
