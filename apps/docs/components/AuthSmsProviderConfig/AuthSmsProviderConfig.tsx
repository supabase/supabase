'use client'

import { useEffect, useReducer, useRef } from 'react'
import { PhoneLoginsItems } from '../Navigation/NavigationMenu/NavigationMenu.constants'
import { IconPanel } from 'ui-patterns/IconPanel'
import { Dialog, DialogContent, DialogHeader, DialogSection, Heading } from 'ui'
import MessageBird from './MessageBirdConfig.mdx'
import Twilio from './TwilioConfig.mdx'
import Vonage from './VonageConfig.mdx'
import TextLocal from './TextLocalConfig.mdx'

const reducer = (_, action: (typeof PhoneLoginsItems)[number] | undefined) => {
  const url = new URL(document.location.href)
  if (action) {
    url.searchParams.set('showSmsProvider', encodeURIComponent(action.name))
  } else {
    url.searchParams.delete('showSmsProvider')
  }
  window.history.replaceState(null, '', url)
  return action
}

const AuthSmsProviderConfig = () => {
  const [selectedProvider, setSelectedProvider] = useReducer(reducer, undefined)

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
        <div className="grid grid-cols-6 gap-10 not-prose py-8">
          {PhoneLoginsItems.map((provider) => (
            <button
              key={provider.name}
              className="col-span-6 xl:col-span-3"
              onClick={() => setSelectedProvider(provider)}
            >
              <IconPanel
                title={provider.name}
                icon={provider.icon}
                hasLightIcon={provider.hasLightIcon}
              />
            </button>
          ))}
        </div>
      </section>
      <Dialog
        open={!!selectedProvider}
        onOpenChange={(open) => !open && setSelectedProvider(undefined)}
      >
        {selectedProvider && (
          <DialogContent
            className="!w-[min(90vw,80ch)] !max-w-[min(90vw,80ch)] !max-h-[90dvh] prose overflow-auto"
            onOpenAutoFocus={(evt) => {
              evt.preventDefault()
              headingRef.current?.focus()
            }}
          >
            <DialogHeader className="pb-0 [&>h3]:!m-0 [&>h3>a]:!hidden [&>h3:focus-visible]:outline-none">
              <Heading tag="h3" ref={headingRef} tabIndex={-1}>
                {selectedProvider.name}
              </Heading>
            </DialogHeader>
            <DialogSection className="[&>:first-child]:mt-0">
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
