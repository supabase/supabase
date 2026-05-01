import { useStaticEffectEvent } from '~/hooks/useStaticEffectEvent'
import { useRouter } from 'next/router'
import { ComponentType, useEffect, useState } from 'react'
import {
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

export type LegalDocVersion = {
  id: string
  label: string
  effectiveDate: string
  Component: ComponentType
}

interface Props {
  versions: LegalDocVersion[]
}

const LegalDocVersions = ({ versions }: Props) => {
  const router = useRouter()
  const latest = versions[0]
  const [activeId, setActiveId] = useState<string>(latest.id)

  const syncActiveVersion = useStaticEffectEvent(() => {
    const fromQuery = typeof router.query.version === 'string' ? router.query.version : undefined
    if (fromQuery && versions.some((v) => v.id === fromQuery)) {
      setActiveId(fromQuery)
    } else {
      setActiveId(latest.id)
    }
  })

  useEffect(() => {
    if (!router.isReady) return
    syncActiveVersion()
  }, [router.isReady, router.query.version, syncActiveVersion])

  const active = versions.find((v) => v.id === activeId) ?? latest
  const ActiveComponent = active.Component

  const handleChange = (value: string) => {
    setActiveId(value)
    const { version: _omit, ...rest } = router.query
    const nextQuery = value === latest.id ? rest : { ...rest, version: value }
    router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true })
  }

  return (
    <>
      <div className="not-prose mb-8 flex items-center gap-3">
        <label htmlFor="legal-doc-version" className="text-foreground-lighter text-sm">
          Version
        </label>
        <Select_Shadcn_ value={activeId} onValueChange={handleChange}>
          <SelectTrigger_Shadcn_ id="legal-doc-version" className="w-auto min-w-[260px]">
            <SelectValue_Shadcn_ />
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_>
            {versions.map((v) => (
              <SelectItem_Shadcn_ key={v.id} value={v.id}>
                {v.label} — {v.effectiveDate}
              </SelectItem_Shadcn_>
            ))}
          </SelectContent_Shadcn_>
        </Select_Shadcn_>
      </div>
      <ActiveComponent />
    </>
  )
}

export default LegalDocVersions
