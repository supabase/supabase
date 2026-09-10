import { type SafeSqlFragment } from '@supabase/pg-meta'
import type { ReactNode } from 'react'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

type IntrospectionMode = 'enable' | 'disable'

interface ModeCopy {
  title: string
  confirmLabel: string
  confirmLabelLoading: string
  persistenceBullet: (schema: string) => ReactNode
  securityBullet: ReactNode
}

const COPY: Record<IntrospectionMode, ModeCopy> = {
  enable: {
    title: 'Enable GraphQL introspection?',
    confirmLabel: 'Enable introspection',
    confirmLabelLoading: 'Enabling...',
    persistenceBullet: (_schema) => <>This setting persists until explicitly disabled.</>,
    securityBullet: (
      <>
        External actors will be able to introspect your schema using the <code>anon</code> key.
      </>
    ),
  },
  disable: {
    title: 'Disable GraphQL introspection?',
    confirmLabel: 'Disable introspection',
    confirmLabelLoading: 'Disabling...',
    persistenceBullet: (_schema) => <>This setting persists until explicitly re-enabled.</>,
    securityBullet: (
      <>
        External actors will no longer be able to introspect your schema via the <code>anon</code>{' '}
        key. GraphiQL's docs explorer and autocomplete will stop working until introspection is
        re-enabled.
      </>
    ),
  },
}

interface IntrospectionConfirmModalProps {
  mode: IntrospectionMode
  visible: boolean
  schema: string
  sql: SafeSqlFragment
  otherExistingKeys: string[]
  existingDirectiveIsMalformed: boolean
  isPending: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const IntrospectionConfirmModal = ({
  mode,
  visible,
  schema,
  sql,
  otherExistingKeys,
  existingDirectiveIsMalformed,
  isPending,
  onCancel,
  onConfirm,
}: IntrospectionConfirmModalProps) => {
  const copy = COPY[mode]
  const hasPreservedOptions = otherExistingKeys.length > 0

  return (
    <ConfirmationModal
      visible={visible}
      size="large"
      title={copy.title}
      confirmLabel={copy.confirmLabel}
      confirmLabelLoading={copy.confirmLabelLoading}
      cancelLabel="Cancel"
      loading={isPending}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <div className="space-y-4 text-sm">
        <ul className="list-disc space-y-1 pl-5 text-foreground-light">
          <li>{copy.persistenceBullet(schema)}</li>
          <li>{copy.securityBullet}</li>
          {hasPreservedOptions && (
            <li>
              Existing <code>@graphql(...)</code> options on this schema will be preserved:{' '}
              <PreservedOptionKeys keys={otherExistingKeys} />.
            </li>
          )}
          {existingDirectiveIsMalformed && (
            <li className="text-warning">
              The existing <code>@graphql(...)</code> directive on this schema could not be parsed
              and will be replaced by the statement below.
            </li>
          )}
        </ul>

        <div>
          <p className="text-foreground-light mb-2">The following statement will be executed:</p>
          <CodeBlock language="sql" className="text-xs" hideLineNumbers>
            {sql}
          </CodeBlock>
        </div>
      </div>
    </ConfirmationModal>
  )
}

const PreservedOptionKeys = ({ keys }: { keys: string[] }) => (
  <>
    {keys.map((k, i) => (
      <span key={k}>
        {i > 0 && ', '}
        <code>{k}</code>
      </span>
    ))}
  </>
)
