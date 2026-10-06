import { LOCAL_STORAGE_KEYS } from 'common'
import {
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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
        <p className="text-sm font-medium mb-2">We've updated our Terms of Service.</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="tiny" className="w-min">
              Learn more
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Terms of Service update</DialogTitle>
              <DialogDescription>
                The new terms say which Supabase entity you contract with, add Supplemental Terms
                for certain features we may release or local law compliance, set new terms for alpha
                and beta features, and make accommodations for cloud marketplace transactions.
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 pb-6 text-sm">
              <InlineLink href="https://supabase.com/terms">Read the Terms of Service</InlineLink>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button onClick={acknowledgeUpdate}>Understood</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </BannerCard>
  )
}
