import { Dispatch, SetStateAction, useId } from 'react'
import { Checkbox, Switch } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import {
  AUTHORIZATION_COPY,
  AuthorizationToggleState,
  getAuthorizationPreviewExplanation,
  getResultingGrantDescription,
} from './Authorization.utils'

interface AuthorizationToggleProps {
  label: string
  description: string
  warningBody: string
  state: AuthorizationToggleState
  onCheckedChange: Dispatch<SetStateAction<boolean>>
  onConfirmedChange: Dispatch<SetStateAction<boolean>>
}

const AuthorizationToggle = ({
  label,
  description,
  warningBody,
  state,
  onCheckedChange,
  onConfirmedChange,
}: AuthorizationToggleProps) => {
  const checkboxId = useId()
  const isNewlyEnabled = state.checked && !state.locked

  return (
    <div className="space-y-3">
      <FormItemLayout
        isReactForm={false}
        layout="flex-row-reverse"
        className="justify-between"
        label={label}
        description={description}
      >
        <Switch
          checked={state.checked}
          disabled={state.locked}
          aria-label={label}
          onCheckedChange={(checked) => {
            onCheckedChange(checked)
            if (!checked) onConfirmedChange(false)
          }}
        />
      </FormItemLayout>
      {isNewlyEnabled && (
        <Admonition type="warning" layout="vertical" title={AUTHORIZATION_COPY.warningTitle}>
          <p>{warningBody}</p>
          <label htmlFor={checkboxId} className="flex items-start gap-2 pt-2 cursor-pointer">
            <Checkbox
              id={checkboxId}
              checked={state.confirmed}
              onCheckedChange={(checked) => onConfirmedChange(checked === true)}
              className="mt-0.5"
            />
            <span className="text-sm text-foreground">{AUTHORIZATION_COPY.confirmationLabel}</span>
          </label>
        </Admonition>
      )}
    </div>
  )
}

export interface AuthorizationSectionProps {
  memberBoundGrant: AuthorizationToggleState
  onMemberBoundGrantChange: Dispatch<SetStateAction<boolean>>
  onMemberBoundGrantConfirmedChange: Dispatch<SetStateAction<boolean>>
  projectScoping: AuthorizationToggleState
  onProjectScopingChange: Dispatch<SetStateAction<boolean>>
  onProjectScopingConfirmedChange: Dispatch<SetStateAction<boolean>>
}

export const AuthorizationSection = ({
  memberBoundGrant,
  onMemberBoundGrantChange,
  onMemberBoundGrantConfirmedChange,
  projectScoping,
  onProjectScopingChange,
  onProjectScopingConfirmedChange,
}: AuthorizationSectionProps) => {
  const explanation = getAuthorizationPreviewExplanation(
    memberBoundGrant.checked,
    projectScoping.checked
  )
  const resultingGrant = getResultingGrantDescription(
    memberBoundGrant.checked,
    projectScoping.checked
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col">
        <span className="text-sm text-foreground">{AUTHORIZATION_COPY.sectionTitle}</span>
        <span className="text-sm text-foreground-light">
          {AUTHORIZATION_COPY.sectionDescription}
        </span>
      </div>

      <AuthorizationToggle
        label={AUTHORIZATION_COPY.memberBoundGrant.label}
        description={AUTHORIZATION_COPY.memberBoundGrant.description}
        warningBody={AUTHORIZATION_COPY.memberBoundGrant.warningBody}
        state={memberBoundGrant}
        onCheckedChange={onMemberBoundGrantChange}
        onConfirmedChange={onMemberBoundGrantConfirmedChange}
      />

      <AuthorizationToggle
        label={AUTHORIZATION_COPY.projectScoping.label}
        description={AUTHORIZATION_COPY.projectScoping.description}
        warningBody={AUTHORIZATION_COPY.projectScoping.warningBody}
        state={projectScoping}
        onCheckedChange={onProjectScopingChange}
        onConfirmedChange={onProjectScopingConfirmedChange}
      />

      <div className="rounded-md border border-control bg-surface-200 px-4 py-3 space-y-2">
        <p className="text-sm text-foreground">{AUTHORIZATION_COPY.previewTitle}</p>
        <div className="space-y-2 text-sm text-foreground-light">
          <p>{AUTHORIZATION_COPY.previewIntro}</p>
          {explanation && <p>{explanation}</p>}
        </div>
        <p className="text-sm">
          <span className="text-foreground-lighter">{AUTHORIZATION_COPY.resultingGrantLabel} </span>
          <span className="text-foreground-light">{resultingGrant}</span>
        </p>
      </div>
    </div>
  )
}
