'use client'

import { componentPages, frameworkTitles } from '@/config/docs'
import { useFramework } from '@/context/framework-context'
import { SelectValue } from '@ui/components/shadcn/ui/select'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
} from 'ui'

interface FrameworkSelectorProps {
  docTitle: string
  framework: string
}

const frameworks = Object.keys(frameworkTitles)

export function FrameworkSelector({ docTitle, framework }: FrameworkSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { setFramework: setPreferredFramework } = useFramework()
  const selectedFramework = frameworks.includes(framework) ? framework! : 'nextjs'

  // Check if this is a component/doc that supports multiple frameworks
  const isComponentDoc = Object.keys(componentPages).includes(docTitle)

  // Don't show selector for non-framework related docs (Getting Started, etc.)
  if (!isComponentDoc) {
    return null
  }

  // Get the supported frameworks for this component
  const supportedFrameworks = componentPages[docTitle]?.supportedFrameworks || []

  // Don't show selector if component only supports one framework
  if (supportedFrameworks.length <= 1) {
    return null
  }

  const onSelect = (value: string) => {
    // Update the framework query parameter
    const params = new URLSearchParams(searchParams.toString())
    params.set('framework', value)
    router.push(`${pathname}?${params.toString()}`)

    // Also update the context/localStorage for future use
    setPreferredFramework(value as keyof typeof frameworkTitles)
  }

  const options = supportedFrameworks.map((f) => ({
    label: frameworkTitles[f],
    value: f,
  }))

  return (
    <Select_Shadcn_ value={selectedFramework} onValueChange={onSelect}>
      <SelectTrigger_Shadcn_ className="w-[180px]">
        <SelectValue />
      </SelectTrigger_Shadcn_>
      <SelectContent_Shadcn_>
        <SelectGroup_Shadcn_>
          {options.map((f) => (
            <SelectItem_Shadcn_ key={f.value} value={f.value}>
              {f.label}
            </SelectItem_Shadcn_>
          ))}
        </SelectGroup_Shadcn_>
      </SelectContent_Shadcn_>
    </Select_Shadcn_>
  )
}
