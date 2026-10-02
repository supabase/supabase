import { Admonition } from 'ui-patterns/Admonition'

import { InlineLink } from '@/components/ui/InlineLink'
import { DOCS_URL } from '@/lib/constants'

export const ForeignTableSecurityWarning = () => (
  <Admonition type="warning" title="Foreign tables are not protected by RLS">
    Foreign tables do not support Row Level Security. Keep them in a private schema, or expose
    selected data through a security-definer function.{' '}
    <InlineLink href={`${DOCS_URL}/guides/database/extensions/wrappers/overview#security`}>
      Learn more
    </InlineLink>
  </Admonition>
)
