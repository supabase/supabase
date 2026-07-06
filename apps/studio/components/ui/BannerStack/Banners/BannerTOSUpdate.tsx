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
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
} from 'ui'

import { InlineLink } from '../../InlineLink'
import { BannerCard } from '../BannerCard'
import { useBannerStack } from '../BannerStackProvider'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

/**
 * [Joshen] TOS update takes place from 6th June onwards, can remove from 4th July onwards as
 * previously stated in the NoticeBanner
 */

export const BannerTOSUpdate = () => {
  const { dismissBanner } = useBannerStack()
  const [, setTOSUpdateAcknowledged] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.TERMS_OF_SERVICE_UPDATE,
    false
  )

  return (
    <BannerCard
      onDismiss={() => {
        setTOSUpdateAcknowledged(true)
        dismissBanner('tos-update-banner')
      }}
    >
      <div className="flex flex-col gap-y-2">
        <Badge variant="default" className="w-min -ml-0.5 uppercase inline-flex items-center mb-2">
          Notice
        </Badge>

        <div className="flex flex-col gap-y-1 mb-2">
          <p className="text-sm font-medium">We've updated our Terms of Service</p>
          <p className="text-xs text-foreground-lighter text-balance">
            Updates define the responsibilities of both you and Supabase in the use of AI.
          </p>
        </div>
        <UpdatedTermsOfServiceDialog />
      </div>
    </BannerCard>
  )
}

const UpdatedTermsOfServiceDialog = () => {
  const [, setTOSUpdateAcknowledged] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.TERMS_OF_SERVICE_UPDATE,
    false
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" className="w-min">
          Learn more
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Terms of Service update</DialogTitle>
          <DialogDescription>
            We've updated our Terms of Service to better define the responsibilities of both you and
            Supabase in the use of AI.
          </DialogDescription>
        </DialogHeader>

        <DialogSectionSeparator />

        <DialogSection className="text-sm flex flex-col gap-y-2">
          <p>
            We've clarified how we use AI in our customer support tooling, introduced guidelines for
            the responsible use of AI by our users, and updated our indemnification terms to clarify
            the allocation of responsibility for claims arising from AI-generated inputs and
            outputs.
          </p>

          <p>
            Additionally, we've made an explicit commitment that Supabase will never use the data
            you submit to the Supabase services to train or improve any AI without your prior
            written consent.
          </p>

          <p>
            The updated Terms (Version 2) will take effect on June 6, 2026. By continuing to use the
            Services after that date, you agree to the updated Terms. You can review the changes{' '}
            <InlineLink href="https://supabase.com/terms">here</InlineLink>.
          </p>

          <p>
            This notice applies to users on Supabase's standard Terms of Service only. If you are on
            an Enterprise plan or with a separately negotiated agreement, your existing terms
            continue to govern your use of the Services.
          </p>
        </DialogSection>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="default"
              className="opacity-100"
              onClick={() => setTOSUpdateAcknowledged(true)}
            >
              Understood
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
