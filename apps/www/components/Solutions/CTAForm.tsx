import React, { FC } from 'react'
import { cn, TextLink } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import TalkToPartnershipTeamForm from '~/components/Forms/TalkToPartnershipTeamForm'

interface Props {}

const UseCases: FC<Props> = () => {
  return (
    <SectionContainer className="text grid gap-8 lg:gap-12 md:grid-cols-2 xl:pt-20">
      <div className="md:h-full w-full flex flex-col justify-between gap-4 lg:gap-8">
        <div className="flex flex-col gap-2 md:max-w-md">
          <h1 className="h1 !m-0">
            Talk to our
            <br className="hidden md:block" /> partnership team
          </h1>
          <p className="md:text-lg text-foreground-lighter">
            Explore custom pricing and infrastructure options.
          </p>
        </div>
        <ConnectCallout className="hidden md:flex" />
      </div>
      <TalkToPartnershipTeamForm />
      <ConnectCallout className="md:hidden" />
    </SectionContainer>
  )
}

const ConnectCallout: FC<{ className?: string }> = ({ className }) => (
  <div className={cn('border rounded-lg p-4 md:p-6 bg-surface-75 flex flex-col gap-2', className)}>
    <h5>Connect your app to Supabase now</h5>
    <p className="text-foreground-lighter">
      Set up a Supabase OAuth app so your users can start interacting with their Supabase Project.
    </p>
    <TextLink
      url="https://supabase.com/docs/guides/integrations/build-a-supabase-integration"
      label="View docs"
    />
  </div>
)

export default UseCases
