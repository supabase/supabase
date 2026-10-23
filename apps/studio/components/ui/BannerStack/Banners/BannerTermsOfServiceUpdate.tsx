import { LOCAL_STORAGE_KEYS } from 'common'
import {
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
} from 'ui'

import { BannerCard } from '../BannerCard'
import { BANNER_ID, useBannerStack } from '../BannerStackProvider'
import { InlineLink } from '@/components/ui/InlineLink'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

export const BannerTermsOfServiceUpdate = () => {
  const { dismissBanner } = useBannerStack()
  const [, setIsAcknowledged] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.TERMS_OF_SERVICE_UPDATE,
    false
  )

  const acknowledgeUpdate = () => {
    setIsAcknowledged(true)
    dismissBanner(BANNER_ID.TERMS_OF_SERVICE_UPDATE)
  }

  return (
    <BannerCard onDismiss={acknowledgeUpdate}>
      <div className="flex flex-col gap-y-2">
        <Badge variant="default" className="w-min -ml-0.5 uppercase inline-flex items-center mb-2">
          Notice
        </Badge>
        <div className="flex flex-col gap-y-1 mb-2">
          <p className="text-sm font-medium">We’ve updated our Terms of Service</p>
          <p className="text-xs text-foreground-lighter text-balance">
            The new terms cover who you contract with, alpha and beta features, and cloud
            marketplace purchases.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="tiny" className="w-min">
              Learn more
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Terms of Service update</DialogTitle>
            </DialogHeader>
            <DialogSectionSeparator />
            <DialogSection className="text-sm flex flex-col gap-y-2">
              <p>We’ve updated our Terms of Service. The updated terms:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Clarify which Supabase entity you contract with.</li>
                <li>
                  Add Supplemental Terms for certain features we may release or to comply with local
                  laws.
                </li>
                <li>Set new terms for alpha and beta features.</li>
                <li>Make accommodations for purchases through cloud marketplaces.</li>
              </ul>
              <p>
                Read the updated{' '}
                <InlineLink href="https://supabase.com/terms">Terms of Service</InlineLink>.
              </p>
            </DialogSection>
            <DialogFooter>
              <DialogClose asChild>
                <Button onClick={acknowledgeUpdate}>Got it</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </BannerCard>
  )
}
