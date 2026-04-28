'use client'

import { useConsentState } from 'common'
import Link from 'next/link'
import { PropsWithChildren, useEffect, useState } from 'react'
import { Modal, Toggle } from 'ui'

import { Admonition } from '../admonition'

interface PrivacySettingsProps {
  className?: string
}

function buildServiceConsentMap(
  categories:
    | {
        isEssential: boolean
        services: readonly {
          id: string
          consent: {
            status: boolean
          }
        }[]
      }[]
    | null
) {
  const consentMap = new Map<string, boolean>()

  categories?.forEach((category) => {
    if (category.isEssential) return

    category.services.forEach((service) => {
      consentMap.set(service.id, service.consent.status)
    })
  })

  return consentMap
}

export const PrivacySettings = ({
  children,
  ...props
}: PropsWithChildren<PrivacySettingsProps>) => {
  const [isOpen, setIsOpen] = useState(false)
  const { categories, updateServices } = useConsentState()

  const [serviceConsentMap, setServiceConsentMap] = useState(() =>
    buildServiceConsentMap(categories)
  )

  // Reseed the consent map if categories arrive while the modal is open. The
  // useState initializer above runs once at mount, and the button onClick
  // below reseeds when the modal opens — but if the user opens the modal
  // during the SDK init window (categories === null), the modal renders an
  // "Unable to Load Privacy Settings" admonition with no toggles, then
  // categories arrives asynchronously and the toggles render. Without this
  // effect, the map stays empty and a subsequent toggle + Confirm would
  // submit only the toggled service — exactly the partial-submit bug this
  // component is meant to prevent.
  //
  // The empty-map guard prevents this effect from clobbering in-progress
  // user toggles in any unforeseen scenario where categories' reference
  // changes mid-session.
  useEffect(() => {
    if (!isOpen || !categories) return
    setServiceConsentMap((current) =>
      current.size === 0 ? buildServiceConsentMap(categories) : current
    )
  }, [isOpen, categories])

  function handleServicesChange(services: { id: string; status: boolean }[]) {
    setServiceConsentMap((currentConsentMap) => {
      const nextConsentMap = new Map(currentConsentMap)

      services.forEach((service) => {
        nextConsentMap.set(service.id, service.status)
      })

      return nextConsentMap
    })
  }

  const handleConfirmPreferences = () => {
    const services = Array.from(serviceConsentMap.entries()).map(([id, status]) => ({
      serviceId: id,
      status,
    }))
    updateServices(services)

    setIsOpen(false)
  }

  const handleCancel = () => {
    setIsOpen(false)
  }

  return (
    <>
      <button
        {...props}
        onClick={() => {
          setServiceConsentMap(buildServiceConsentMap(categories))
          setIsOpen(true)
        }}
      >
        {children}
      </button>

      <Modal
        closable
        visible={isOpen}
        alignFooter="right"
        onCancel={handleCancel}
        onConfirm={handleConfirmPreferences}
        header="Privacy Settings"
        onInteractOutside={(e) => {
          // Only hide menu when clicking outside, not focusing outside
          // Prevents Firefox dropdown issue that immediately closes menu after opening
          if (e.type === 'dismissableLayer.pointerDownOutside') {
            setIsOpen(!isOpen)
          }
        }}
        className="max-w-[calc(100vw-4rem)]"
        size="medium"
      >
        <div className="pt-3 divide-y divide-border">
          {categories === null ? (
            <Modal.Content>
              <Admonition
                type="warning"
                title="Unable to Load Privacy Settings"
                description={
                  <>
                    We couldn't load the privacy settings due to an ad blocker or network error.
                    Please disable any ad blockers and try again. If the problem persists, please{' '}
                    <Link href="https://supabase.com/dashboard/support/new" className="underline">
                      contact support
                    </Link>
                    .
                  </>
                }
              />
            </Modal.Content>
          ) : (
            [...categories]
              .reverse()
              .map((category) => (
                <Category
                  key={category.slug}
                  category={category}
                  handleServicesChange={handleServicesChange}
                />
              ))
          )}
        </div>
      </Modal>
    </>
  )
}

function Category({
  category,
  handleServicesChange,
}: {
  category: {
    slug: string
    label: string
    description: string
    isEssential: boolean
    services: readonly {
      id: string
      consent: {
        status: boolean
      }
    }[]
  }
  handleServicesChange: (services: { id: string; status: boolean }[]) => void
}) {
  const [isChecked, setIsChecked] = useState(() =>
    category.services.every((service) => service.consent.status)
  )

  function handleChange() {
    setIsChecked(!isChecked)

    handleServicesChange(
      category.services.map((service) => ({
        id: service.id,
        status: !isChecked,
      }))
    )
  }

  return (
    <Modal.Content key={category.slug}>
      <Toggle
        checked={isChecked}
        defaultChecked={isChecked}
        disabled={category.isEssential}
        onChange={handleChange}
        label={category.label}
        descriptionText={
          <>
            {category.description}
            <br />
            <Link
              href="https://supabase.com/privacy#8-cookies-and-similar-technologies-used-on-our-european-services"
              className="underline"
            >
              Learn more
            </Link>
          </>
        }
      />
    </Modal.Content>
  )
}
