import { useId } from 'react'
import { Control, FieldPath, FieldValues, useFormContext, useWatch } from 'react-hook-form'
import { Checkbox, FormControl, FormField, Switch } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import {
  AUTHORIZATION_COPY,
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
        <Admonition type="warning" layout="vertical" title={AUTHORIZATION_COPY.warningTitle}>
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
                    {AUTHORIZATION_COPY.confirmationLabel}
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
        <span className="text-sm text-foreground">{AUTHORIZATION_COPY.sectionTitle}</span>
        <span className="text-sm text-foreground-light">
          {AUTHORIZATION_COPY.sectionDescription}
        </span>
      </div>

      <OneTimeWithConfirmToggle
        control={control}
        label={AUTHORIZATION_COPY.memberBoundGrant.label}
        description={AUTHORIZATION_COPY.memberBoundGrant.description}
        warningBody={AUTHORIZATION_COPY.memberBoundGrant.warningBody}
        name="member_bound_grant"
        confirmedName="member_bound_grant_confirmed"
      />

      <OneTimeWithConfirmToggle
        control={control}
        label={AUTHORIZATION_COPY.projectScoping.label}
        description={AUTHORIZATION_COPY.projectScoping.description}
        warningBody={AUTHORIZATION_COPY.projectScoping.warningBody}
        name="project_scoping"
        confirmedName="project_scoping_confirmed"
      />

      <Admonition type="note" layout="vertical" title={AUTHORIZATION_COPY.previewTitle}>
        <p>{AUTHORIZATION_COPY.previewIntro}</p>
        {explanation && <p>{explanation}</p>}
        <p>
          <span className="text-foreground-lighter">{AUTHORIZATION_COPY.resultingGrantLabel} </span>
          <span className="text-foreground-light">{resultingGrant}</span>
        </p>
      </Admonition>
    </div>
  )
}
