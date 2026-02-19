import Link from 'next/link'
import { useLayoutEffect, useState } from 'react'
import {
  Checkbox_Shadcn_,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Label_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import type { DatabaseFunction } from '@/data/database-functions/database-functions-query'
import type {
  FunctionApiAccessData,
  FunctionApiAccessRole,
  FunctionApiPrivilegesByRole,
} from '@/data/privileges/function-api-access-query'
import { useStaticEffectEvent } from '@/hooks/useStaticEffectEvent'

const ROLE_LABELS: Record<FunctionApiAccessRole, string> = {
  anon: 'anon',
  authenticated: 'authenticated',
  service_role: 'service_role',
}

type AlertConfig = { title: string; description: string }

function getAlertConfig({
  breakingChange,
  willEnableAnonAccess,
  willEnableAuthenticatedAccess,
}: {
  breakingChange: boolean
  willEnableAnonAccess: boolean
  willEnableAuthenticatedAccess: boolean
}): AlertConfig | undefined {
  if (breakingChange) {
    return {
      title: 'Breaking change',
      description: 'Existing API calls to this function will stop working.',
    }
  }
  if (willEnableAnonAccess) {
    return {
      title: 'Security consideration',
      description: 'Anyone with your API credentials will be able to call this function.',
    }
  }
  if (willEnableAuthenticatedAccess) {
    return {
      title: 'Security consideration',
      description:
        'Any user of your app will be able to call this function with your API credentials.',
    }
  }
  return undefined
}

interface RoleCheckboxProps {
  role: FunctionApiAccessRole
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

const RoleCheckbox = ({ role, checked, onCheckedChange }: RoleCheckboxProps) => {
  const id = `${role}-access`

  return (
    <div className="flex items-center space-x-3">
      <Checkbox_Shadcn_
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <Label_Shadcn_ htmlFor={id} className="cursor-pointer">
        <span className="font-mono text-xs">{ROLE_LABELS[role]}</span>
      </Label_Shadcn_>
    </div>
  )
}

interface ToggleFunctionApiAccessModalProps {
  func: DatabaseFunction | null
  apiAccessData?: FunctionApiAccessData
  projectRef?: string
  isLoading: boolean
  onConfirm: (roles: FunctionApiPrivilegesByRole) => void
  onCancel: () => void
}

export const ToggleFunctionApiAccessModal = ({
  func,
  apiAccessData,
  projectRef,
  isLoading,
  onConfirm,
  onCancel,
}: ToggleFunctionApiAccessModalProps) => {
  if (!func) {
    return null
  }

  if (apiAccessData?.apiAccessType === 'none') {
    return (
      <SchemaNotExposedModal
        visible
        schema={func.schema}
        projectRef={projectRef}
        onClose={onCancel}
      />
    )
  }

  const currentPrivileges: FunctionApiPrivilegesByRole =
    apiAccessData?.apiAccessType === 'access'
      ? apiAccessData.privileges
      : { anon: false, authenticated: false, service_role: false }

  return (
    <ConfigureApiAccessModal
      visible
      func={func}
      currentPrivileges={currentPrivileges}
      isLoading={isLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

interface SchemaNotExposedModalProps {
  visible: boolean
  schema?: string
  projectRef?: string
  onClose: () => void
}

const SchemaNotExposedModal = ({
  visible,
  schema,
  projectRef,
  onClose,
}: SchemaNotExposedModalProps) => {
  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="pb-5" size="small">
        <DialogHeader className="border-b" padding="small">
          <DialogTitle>Configure API access</DialogTitle>
        </DialogHeader>
        <DialogSection padding="small">
          <Admonition
            type="default"
            title={`The "${schema}" schema is not exposed via the Data API`}
            description={
              <>
                To enable API access for this function, you need to first expose the{' '}
                <code className="text-xs">{schema}</code> schema in your{' '}
                <Link
                  href={`/project/${projectRef}/settings/api`}
                  className="text-foreground hover:underline"
                >
                  API settings
                </Link>
                .
              </>
            }
          />
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}

interface ConfigureApiAccessModalProps {
  visible: boolean
  func: DatabaseFunction | null
  currentPrivileges: FunctionApiPrivilegesByRole
  isLoading: boolean
  onConfirm: (roles: FunctionApiPrivilegesByRole) => void
  onCancel: () => void
}

const ConfigureApiAccessModal = ({
  visible,
  func,
  currentPrivileges,
  isLoading,
  onConfirm,
  onCancel,
}: ConfigureApiAccessModalProps) => {
  const { name, schema } = func ?? {}

  const [formAnonEnabled, setFormAnonEnabled] = useState(currentPrivileges.anon)
  const [formAuthenticatedEnabled, setFormAuthenticatedEnabled] = useState(
    currentPrivileges.authenticated
  )
  const [formServiceRoleEnabled, setFormServiceRoleEnabled] = useState(
    currentPrivileges.service_role
  )

  const syncPrivileges = useStaticEffectEvent(() => {
    setFormAnonEnabled(currentPrivileges.anon)
    setFormAuthenticatedEnabled(currentPrivileges.authenticated)
    setFormServiceRoleEnabled(currentPrivileges.service_role)
  })

  // Reset state when modal opens with new function
  useLayoutEffect(() => {
    if (visible) {
      syncPrivileges()
    }
  }, [visible, syncPrivileges])

  const willEnableAnonAccess = !currentPrivileges.anon && formAnonEnabled
  const willEnableAuthenticatedAccess = !currentPrivileges.authenticated && formAuthenticatedEnabled
  const breakingChange =
    (currentPrivileges.anon && !formAnonEnabled) ||
    (currentPrivileges.authenticated && !formAuthenticatedEnabled) ||
    (currentPrivileges.service_role && !formServiceRoleEnabled)

  const alertConfig = getAlertConfig({
    breakingChange,
    willEnableAnonAccess,
    willEnableAuthenticatedAccess,
  })

  const variant = breakingChange
    ? 'destructive'
    : willEnableAnonAccess || willEnableAuthenticatedAccess
      ? 'warning'
      : 'default'

  return (
    <ConfirmationModal
      visible={visible}
      title="Configure API access"
      confirmLabel="Save changes"
      confirmLabelLoading="Saving..."
      onCancel={onCancel}
      onConfirm={() =>
        onConfirm({
          anon: formAnonEnabled,
          authenticated: formAuthenticatedEnabled,
          service_role: formServiceRoleEnabled,
        })
      }
      loading={isLoading}
      variant={variant}
      alert={alertConfig}
    >
      <div className="space-y-4">
        <p className="text-sm text-foreground-light">
          Configure which roles can call the function{' '}
          <code className="text-xs">
            {schema}.{name}
          </code>{' '}
          via the Data API.
        </p>

        <div className="space-y-3">
          <RoleCheckbox
            role="anon"
            checked={formAnonEnabled}
            onCheckedChange={setFormAnonEnabled}
          />
          <RoleCheckbox
            role="authenticated"
            checked={formAuthenticatedEnabled}
            onCheckedChange={setFormAuthenticatedEnabled}
          />
          <RoleCheckbox
            role="service_role"
            checked={formServiceRoleEnabled}
            onCheckedChange={setFormServiceRoleEnabled}
          />
        </div>
      </div>
    </ConfirmationModal>
  )
}
