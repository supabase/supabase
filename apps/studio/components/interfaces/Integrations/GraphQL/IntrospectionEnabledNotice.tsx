import { useState } from 'react'
import { Button } from 'ui'

import { IntrospectionConfirmModal } from './IntrospectionConfirmModal'
import { useSetIntrospection } from './useSetIntrospection'

interface IntrospectionEnabledNoticeProps {
  schema: string
  currentSchemaComment: string | null | undefined
  onDisabled: () => void
}

export const IntrospectionEnabledNotice = ({
  schema,
  currentSchemaComment,
  onDisabled,
}: IntrospectionEnabledNoticeProps) => {
  const [showConfirm, setShowConfirm] = useState(false)

  const { apply, isPending, sql, existingDirectiveIsMalformed, otherExistingKeys } =
    useSetIntrospection({
      schema,
      currentSchemaComment,
      enabled: false,
      onMutationSuccess: () => setShowConfirm(false),
      onInvalidated: onDisabled,
    })

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b bg-surface-100 px-4 py-2 text-xs text-foreground-light">
        <span>
          GraphQL introspection is enabled for this project, so schemas are discoverable through the
          API.
        </span>
        <Button type="default" size="tiny" onClick={() => setShowConfirm(true)}>
          Disable introspection
        </Button>
      </div>

      <IntrospectionConfirmModal
        mode="disable"
        visible={showConfirm}
        schema={schema}
        sql={sql}
        otherExistingKeys={otherExistingKeys}
        existingDirectiveIsMalformed={existingDirectiveIsMalformed}
        isPending={isPending}
        onCancel={() => setShowConfirm(false)}
        onConfirm={apply}
      />
    </>
  )
}
