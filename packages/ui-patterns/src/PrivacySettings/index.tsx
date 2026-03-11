'use client'

import { useConsentState } from 'common'
import Link from 'next/link'
import { PropsWithChildren, useState } from 'react'
import { Modal, Toggle } from 'ui'

import { Admonition } from '../admonition'

interface PrivacySettingsProps {
  className?: string
}

export const PrivacySettings = ({
  children,
  ...props
}: PropsWithChildren<PrivacySettingsProps>) => {
  const [isOpen, setIsOpen] = useState(false)
  const { categories, updateServices } = useConsentState()

  const [serviceConsentMap, setServiceConsentMap] = useState(() => new Map<string, boolean>())

  function handleServicesChange(services: { id: string; status: boolean }[]) {
    let newServiceConsentMap = new Map(serviceConsentMap)
    services.forEach((service) => {
      newServiceConsentMap.set(service.id, service.status)
    })
    setServiceConsentMap(newServiceConsentMap)
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
      <button {...props} onClick={() => setIsOpen(true)}>
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
