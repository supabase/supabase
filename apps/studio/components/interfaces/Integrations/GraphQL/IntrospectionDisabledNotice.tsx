import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { PG_GRAPHQL_CONFIG_DOCS_URL } from './constants'
import { IntrospectionConfirmModal } from './IntrospectionConfirmModal'
import { useSetIntrospection } from './useSetIntrospection'
import { InlineLink } from '@/components/ui/InlineLink'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

interface IntrospectionDisabledNoticeProps {
  schema: string
  currentSchemaComment: string | null | undefined
  onEnabled: () => void
}

export const IntrospectionDisabledNotice = ({
  schema,
  currentSchemaComment,
  onEnabled,
}: IntrospectionDisabledNoticeProps) => {
  const { ref: projectRef } = useParams()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isCollapsed, setIsCollapsed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.GRAPHQL_INTROSPECTION_NOTICE_COLLAPSED(projectRef ?? ''),
    false
  )

  const { apply, isPending, sql, existingDirectiveIsMalformed, otherExistingKeys } =
    useSetIntrospection({
      schema,
      currentSchemaComment,
      enabled: true,
      onMutationSuccess: () => setShowConfirm(false),
      onInvalidated: onEnabled,
    })

  return (
    <>
      {isCollapsed ? (
        <div className="flex items-center justify-between gap-3 border-b bg-surface-100 px-4 py-2 text-xs text-foreground-light">
          <span>
            GraphQL introspection is disabled — docs explorer and autocomplete are unavailable.
          </span>
          <div className="flex items-center gap-1">
            <Button type="default" size="tiny" onClick={() => setShowConfirm(true)}>
              Enable introspection
            </Button>
            <Button
              type="text"
              size="tiny"
              icon={<ChevronDown />}
              onClick={() => setIsCollapsed(false)}
              aria-label="Show introspection notice details"
            />
          </div>
        </div>
      ) : (
        <div className="relative">
          <Admonition
            type="default"
            title="GraphQL introspection is disabled for this project"
            className="m-0 rounded-none border-x-0 border-t-0"
          >
            <p>
              GraphiQL relies on introspection to populate the docs explorer and field autocomplete.
              With <code>pg_graphql</code> 1.6+, introspection is disabled by default so that
              schemas aren't enumerable via the API. You can still run queries — only schema
              discovery is affected.{' '}
              <InlineLink href={PG_GRAPHQL_CONFIG_DOCS_URL} target="_blank" rel="noreferrer">
                Learn more
              </InlineLink>
              .
            </p>
            <div className="mt-3">
              <Button type="default" onClick={() => setShowConfirm(true)}>
                Enable introspection
              </Button>
            </div>
          </Admonition>
          <Button
            className="absolute right-2 top-2"
            type="text"
            size="tiny"
            icon={<ChevronUp />}
            onClick={() => setIsCollapsed(true)}
            aria-label="Collapse introspection notice"
          />
        </div>
      )}

      <IntrospectionConfirmModal
        mode="enable"
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
