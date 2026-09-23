import { LOCAL_STORAGE_KEYS } from 'common'
import { X } from 'lucide-react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { ButtonTooltip } from '../ui/ButtonTooltip'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { Organization } from '@/types'

interface LogPricingAnnouncementProps {
  org?: Organization
}

export const LogPricingAnnouncement = ({ org }: LogPricingAnnouncementProps) => {
  const plan = org?.plan.id

  const [isMinimized, setIsMinimized] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LOG_PRICING_ANNOUNCEMENT_DISMISSED,
    false
  )

  // Irrelevant for platform customers
  if (plan === 'platform') {
    return null
  }

  if (isMinimized) {
    return null
  }

  return (
    <div>
      <Admonition
        type="note"
        layout="responsive"
        title="Pricing for Supabase Logs"
        description="Logs Ingest becomes metered usage items, with quotas that cover most organizations at no additional cost. This change is for any developer running production workloads on Supabase who relies on logs to debug, monitor, and understand their app. Grace period lasts until the start of 2027."
        actions={
          <>
            <Button asChild variant="default" onClick={(e) => e.stopPropagation()}>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={'https://supabase.com/changelog/logs-usage-based-pricing'}
              >
                Announcement
              </a>
            </Button>
            <ButtonTooltip
              icon={<X />}
              variant="text"
              className="w-6"
              tooltip={{ content: { side: 'bottom', text: 'Dismiss' } }}
              aria-label="Dismiss notice"
              onClick={() => setIsMinimized(true)}
            />
          </>
        }
      />
    </div>
  )
}
