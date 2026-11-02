'use client'

import { safeHistoryReplaceState } from '~/lib/historyUtils'
import { useEffect, useId, useReducer, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogSection, Heading } from 'ui'

import { PhoneLoginsItems } from '../Navigation/NavigationMenu/NavigationMenu.constants'
import MessageBird from './MessageBirdConfig.mdx'
import TextLocal from './TextLocalConfig.mdx'
import Twilio from './TwilioConfig.mdx'
import Vonage from './VonageConfig.mdx'
import { IconLinkButton, IconLinkImage } from '@/features/ui/IconLink'

const reducer = (_, action: (typeof PhoneLoginsItems)[number] | undefined) => {
  const url = new URL(document.location.href)
  if (action) {
    url.searchParams.set('showSmsProvider', encodeURIComponent(action.name))
  } else {
    url.searchParams.delete('showSmsProvider')
  }
  safeHistoryReplaceState(url.toString())
  return action
}

const AuthSmsProviderConfig = () => {
  const [selectedProvider, setSelectedProvider] = useReducer(reducer, undefined)
  const dialogId = useId()
  const dialogTitleId = useId()

  useEffect(() => {
    const providerName = new URLSearchParams(document.location.search ?? '').get('showSmsProvider')
    if (!providerName) return

    const provider = PhoneLoginsItems.find((item) => item.name === decodeURIComponent(providerName))
    if (provider) setSelectedProvider(provider)
  }, [])

  const headingRef = useRef<HTMLHeadingElement>(null)

  return (
    <>
      <section aria-labelledby="sms-provider-configuration">
        <h3 className="sr-only" id="sms-provider-configuration">
          Configuring SMS Providers
        </h3>
        <ul className="grid grid-cols-12 gap-6 not-prose py-8">
          {PhoneLoginsItems.map((provider) => (
            <li key={provider.name} className="col-span-12 sm:col-span-6 xl:col-span-3">
              <IconLinkButton
                title={provider.name}
                icon={<IconLinkImage path={provider.icon} hasLightIcon={provider.hasLightIcon} />}
                aria-haspopup="dialog"
                aria-expanded={selectedProvider?.name === provider.name}
                aria-controls={selectedProvider?.name === provider.name ? dialogId : undefined}
                onClick={() => setSelectedProvider(provider)}
              />
            </li>
          ))}
        </ul>
      </section>
      <Dialog
        open={!!selectedProvider}
        onOpenChange={(open) => !open && setSelectedProvider(undefined)}
      >
        {selectedProvider && (
          <DialogContent
            id={dialogId}
            className="w-[min(90vw,80ch)]! max-w-[min(90vw,80ch)]! max-h-[90dvh]! prose overflow-auto"
            aria-labelledby={dialogTitleId}
            onOpenAutoFocus={(evt) => {
              evt.preventDefault()
              headingRef.current?.focus()
            }}
          >
            <DialogHeader className="pb-0 [&>h3]:m-0! [&>h3>a]:hidden! [&>h3:focus-visible]:outline-hidden">
              <Heading tag="h3" id={dialogTitleId} ref={headingRef} tabIndex={-1}>
                {selectedProvider.name}
              </Heading>
            </DialogHeader>
            <DialogSection className="*:first:mt-0">
              {selectedProvider.name.toLowerCase().includes('messagebird') && <MessageBird />}
              {selectedProvider.name.toLowerCase().includes('twilio') && <Twilio />}
              {selectedProvider.name.toLowerCase().includes('vonage') && <Vonage />}
              {selectedProvider.name.toLowerCase().includes('textlocal') && <TextLocal />}
            </DialogSection>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}

export default AuthSmsProviderConfig
