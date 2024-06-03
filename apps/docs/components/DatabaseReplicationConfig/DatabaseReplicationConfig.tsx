import { useEffect, useReducer, useRef } from 'react'
import { ReplicationItems } from '../Navigation/NavigationMenu/NavigationMenu.constants'
import { IconPanel } from 'ui-patterns/IconPanel'
import { Dialog, DialogContent, DialogHeader, DialogSection, Heading } from 'ui'
import AirbyteConfig from './tools/AirbyteConfig.mdx'
import StitchConfig from './tools/StitchConfig.mdx'
import FivetranConfig from './tools/FivetranConfig.mdx'
import EstuaryConfig from './tools/EstuaryConfig.mdx'


const reducer = (_, action: (typeof ReplicationItems)[number] | undefined) => {
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

    const provider = ReplicationItems.find((item) => item.name === decodeURIComponent(providerName))
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
          {ReplicationItems.map((provider) => (
            <button
              key={provider.name}
              className="col-span-6 xl:col-span-3"
              onClick={() => setSelectedProvider(provider)}
            >
              <IconPanel
                title={provider.name}
                icon={provider.icon}
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
              {selectedProvider.name.toLowerCase().includes('airbyte') && <AirbyteConfig />}
              {selectedProvider.name.toLowerCase().includes('estuary') && <EstuaryConfig />}
              {selectedProvider.name.toLowerCase().includes('fivetran') && <FivetranConfig />}
              {selectedProvider.name.toLowerCase().includes('stitch') && <StitchConfig />}
            </DialogSection>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}

export default AuthSmsProviderConfig
