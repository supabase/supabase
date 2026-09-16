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
import { BANNER_ID, useBannerStack } from '../BannerStackProvider'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

export const BannerPrivacyPolicyUpdate = () => {
  const { dismissBanner } = useBannerStack()
  const [, setPrivacyPolicyUpdateAcknowledged] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.PRIVACY_POLICY_UPDATE,
    false
  )

  const acknowledgeUpdate = () => {
    setPrivacyPolicyUpdateAcknowledged(true)
    dismissBanner(BANNER_ID.PRIVACY_POLICY_UPDATE)
  }

  return (
    <BannerCard onDismiss={acknowledgeUpdate}>
      <div className="flex flex-col gap-y-2">
        <Badge variant="default" className="w-min -ml-0.5 uppercase inline-flex items-center mb-2">
          Notice
        </Badge>

        <div className="flex flex-col gap-y-1 mb-2">
          <p className="text-sm font-medium">We've updated our Privacy Policy</p>
          <p className="text-xs text-foreground-lighter text-balance">
            The data controller is now Supabase Pte. Ltd. Your rights and protections are unchanged.
          </p>
        </div>
        <PrivacyPolicyUpdateDialog onAcknowledge={acknowledgeUpdate} />
      </div>
    </BannerCard>
  )
}

const PrivacyPolicyUpdateDialog = ({ onAcknowledge }: { onAcknowledge: () => void }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-min">Learn more</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Privacy Policy update</DialogTitle>
          <DialogDescription>
            We've updated our Privacy Policy to align with our Data Processing Addendum.
          </DialogDescription>
        </DialogHeader>

        <DialogSectionSeparator />

        <DialogSection className="text-sm flex flex-col gap-y-2">
          <p>
            The data controller is now listed as Supabase Pte. Ltd. (previously Supabase, Inc.).
          </p>
          <p>
            This is an organizational change for clarity. Your rights, our obligations, and your
            data protections remain unchanged.
          </p>
          <p>
            Read the updated{' '}
            <InlineLink href="https://supabase.com/privacy">Privacy Policy</InlineLink> or{' '}
            <InlineLink href="mailto:privacy@supabase.com">contact us</InlineLink> with any
            questions.
          </p>
        </DialogSection>

        <DialogFooter>
          <DialogClose asChild>
            <Button className="opacity-100" onClick={onAcknowledge}>
              Understood
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
