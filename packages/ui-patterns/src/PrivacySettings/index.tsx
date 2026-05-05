'use client'

import { useConsentState } from 'common'
import Link from 'next/link'
import { PropsWithChildren, useState } from 'react'
import { Label_Shadcn_, Modal, Switch } from 'ui'

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
        <div className="divide-y divide-border">
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
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label_Shadcn_ className="text-base" htmlFor={category.slug}>
            {category.label}
          </Label_Shadcn_>
          <div className="text-sm text-foreground-light" id={`${category.slug}-description`}>
            {category.description}
            <br />
            <Link
              href="https://supabase.com/privacy#8-cookies-and-similar-technologies-used-on-our-european-services"
              className="underline"
            >
              Learn more
            </Link>
          </div>
        </div>
        <Switch
          id={category.slug}
          checked={isChecked}
          disabled={category.isEssential}
          defaultChecked={isChecked}
          onCheckedChange={handleChange}
          aria-describedby={`${category.slug}-description`}
        />
      </div>
    </Modal.Content>
  )
}
