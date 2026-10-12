import { Button } from 'ui'

import type { AdvisorAccountItem } from './AdvisorPanel.types'

export const AdvisorAccountDetail = ({ item }: { item: AdvisorAccountItem }) => (
  <div>
    <h3 className="text-sm mb-2">Scope</h3>
    <p className="text-sm text-foreground-light mb-6">Account</p>

    <h3 className="text-sm mb-2">Issue</h3>
    <p className="text-sm text-foreground-light mb-6">{item.summary}</p>

    <h3 className="text-sm mb-2">Resolve</h3>
    <Button asChild>
      <a href="/account/security">Review account security</a>
    </Button>
  </div>
)
