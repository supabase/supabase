'use client'

import { ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Fragment, useMemo } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  Button,
} from 'ui'

import { REFERENCES, selfHostingServices } from '~/content/navigation.references'

export function SelfHostingDropdown({
  service,
  className,
}: {
  service: string
  className?: string
}) {
  const router = useRouter()

  const serviceOptions = useMemo(
    () => selfHostingServices.map((service) => REFERENCES[service]),
    []
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={className} asChild>
        <Button
          className="group py-4 text-sm text-foreground-lighter justify-between"
          iconRight={
            <ChevronRight
              size={14}
              className="group-data-[state=open]:rotate-90 transition-transform"
            />
          }
        >
          <span>{service[0].toUpperCase() + service.slice(1)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => router.push('/guides/self-hosting')}>
          Overview
        </DropdownMenuItem>
        {serviceOptions.map((option) => (
          <Fragment key={option.name}>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="uppercase tracking-wide font-medium">
              {option.name.replace(/self-hosting\s/i, '')}
            </DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => router.push(`/reference/${option.libPath}`)}>
              Reference
            </DropdownMenuItem>
            {(option.hasConfig ?? true) && (
              <DropdownMenuItem
                onSelect={() =>
                  router.push(
                    `/guides/self-hosting/${option.libPath.replace('self-hosting-', '')}/config`
                  )
                }
              >
                Configuration
              </DropdownMenuItem>
            )}
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
