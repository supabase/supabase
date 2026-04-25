'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

import { componentPages, frameworkTitles } from '@/config/docs'
import { useFramework } from '@/context/framework-context'

const frameworks = Object.keys(frameworkTitles)

export function FrameworkSelector() {
  const pathname = usePathname()

  // Extract framework and docTitle from pathname
  // Example: /ui/docs/nextjs/password-based-auth
  const pathParts = pathname.split('/')
  const docTitle = pathParts[pathParts.length - 1]
  const framework = pathParts[pathParts.length - 2]

  const router = useRouter()
  const { setFramework: setPreferredFramework } = useFramework()
  const selectedFramework = frameworks.includes(framework) ? framework : 'nextjs'

  if (!framework) {
    return null
  }

  // Get the supported frameworks for this component
  const componentItem = componentPages.items.find(
    (item) => item.href?.split('/').pop() === docTitle.toLowerCase()
  )
  // Use the supportedFrameworks property if it exists, otherwise default to all frameworks
  const supportedFrameworks = componentItem?.supportedFrameworks

  if (!supportedFrameworks) {
    return null
  }

  // Don't show selector if component only supports one framework
  if (supportedFrameworks && supportedFrameworks.length <= 1) {
    return null
  }

  const onSelect = (value: string) => {
    // Get current path parts
    const currentPathParts = [...pathParts]
    // Replace the framework part (second to last) with the new framework
    currentPathParts[currentPathParts.length - 2] = value
    // Build the new path
    const newPath = currentPathParts.join('/')

    router.push(newPath)

    // Also update the context/localStorage for future use
    setPreferredFramework(value as keyof typeof frameworkTitles)
  }

  const options =
    supportedFrameworks?.map((f) => ({
      label: frameworkTitles[f],
      value: f,
    })) || []

  return (
    <Select_Shadcn_ value={selectedFramework} onValueChange={onSelect}>
      <SelectTrigger_Shadcn_ className="w-[180px] mt-4 lg:mt-0">
        <SelectValue_Shadcn_ />
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
