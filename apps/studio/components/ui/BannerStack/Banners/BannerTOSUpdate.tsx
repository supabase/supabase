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
          <p className="text-sm font-medium">We're updating our Terms of Service</p>
          <p className="text-xs text-foreground-lighter text-balance">
            Our Data Processing Addendum is now built into the Terms, effective August 1, 2026.
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
            We're updating our Terms of Service, effective August 1, 2026.
          </DialogDescription>
        </DialogHeader>

        <DialogSectionSeparator />

        <DialogSection className="text-sm flex flex-col gap-y-2">
          <p>What's changing:</p>

          <ul className="list-disc pl-4 flex flex-col gap-y-2">
            <li>
              Our{' '}
              <InlineLink href="https://supabase.com/legal/customer-resources/data-processing-addendum">
                Data Processing Addendum
              </InlineLink>{' '}
              is now built into the Terms, so all customers get its protections automatically. No
              separate signed DPA is needed.
            </li>
            <li>
              Our subprocessor list now lives at{' '}
              <InlineLink href="https://supabase.com/legal/customer-resources/subprocessor-list">
                supabase.com/legal/customer-resources/subprocessor-list
              </InlineLink>
              , where you can subscribe to receive updates to the list.
            </li>
            <li>
              We've added provisions to our fees section relevant to fraud prevention and the rights
              of EU and UK consumers.
            </li>
          </ul>

          <p>
            The updated Terms (Version 3) take effect on August 1, 2026. By continuing to use the
            Services after that date, you agree to the updated Terms. You can review the changes{' '}
            <InlineLink href="https://supabase.com/terms">here</InlineLink>.
          </p>

          <p>
            If you have a separate signed subscription agreement or DPA with us, that agreement
            continues to govern your use of our Services.
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
