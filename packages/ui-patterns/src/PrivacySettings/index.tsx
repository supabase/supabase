'use client'

import { useConsentState } from 'common'
import Link from 'next/link'
import { PropsWithChildren, useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Label,
  Switch,
} from 'ui'

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DialogTrigger asChild>
        <button {...props} onClick={() => setIsOpen(true)}>
          {children}
        </button>
      </DialogTrigger>
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>Privacy Settings</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="space-y-4">
          <div className="divide-y divide-border">
            {categories === null ? (
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
        </DialogSection>
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmPreferences}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    <div className="flex flex-row items-center justify-between gap-4" key={category.slug}>
      <div className="space-y-0.5">
        <Label className="text-base" htmlFor={category.slug}>
          {category.label}
        </Label>
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
  )
}
