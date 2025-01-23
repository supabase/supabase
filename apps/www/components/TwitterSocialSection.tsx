import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { Button } from 'ui'
import SectionContainer from './Layouts/SectionContainer'
import TwitterSocialProof from './Sections/TwitterSocialProof'
import TwitterSocialProofMobile from './Sections/TwitterSocialProofMobile'

import Tweets from '~/data/tweets/Tweets.json'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import { TelemetryActions } from 'common/telemetry-constants'

const TwitterSocialSection = () => {
  const tweets = Tweets.slice(0, 18)
  const sendTelemetryEvent = useSendTelemetryEvent()

  return (
    <>
      <SectionContainer className="w-full text-center flex flex-col items-center !pb-0">
        <h3 className="h2">Join the community</h3>
        <p className="p max-w-[300px] md:max-w-none">
          Discover what our community has to say about their Supabase experience.
        </p>
        <div className="my-4 flex justify-center gap-2">
          <Button asChild size="small" iconRight={<MessageCircle size={14} />} type="default">
            <Link
              href={'https://github.com/supabase/supabase/discussions'}
              target="_blank"
              tabIndex={-1}
              onClick={() =>
                sendTelemetryEvent({
                  action: TelemetryActions.HOMEPAGE_GITHUB_DISCUSSIONS_BUTTON_CLICKED,
                })
              }
            >
              GitHub discussions
            </Link>
          </Button>
          <Button asChild type="default" size="small" iconRight={<MessageCircle size={14} />}>
            <Link
              href={'https://discord.supabase.com/'}
              target="_blank"
              tabIndex={-1}
              onClick={() =>
                sendTelemetryEvent({
                  action: TelemetryActions.HOMEPAGE_DISCORD_BUTTON_CLICKED,
                })
              }
            >
              Discord
            </Link>
          </Button>
        </div>
      </SectionContainer>
      <SectionContainer className="relative w-full !px-0 lg:!px-16 xl:!px-0 !pb-0 mb-16 md:mb-12 lg:mb-12 !pt-6 max-w-[1400px]">
        <TwitterSocialProofMobile className="lg:hidden -mb-32" tweets={tweets} />
        <TwitterSocialProof className="hidden lg:flex" />
      </SectionContainer>
    </>
  )
}

export default TwitterSocialSection
