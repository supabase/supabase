import { useStaticEffectEvent } from '~/hooks/useStaticEffectEvent'
import { useRouter } from 'next/router'
import { ComponentType, useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'

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
        <Select value={activeId} onValueChange={handleChange}>
          <SelectTrigger id="legal-doc-version" className="w-auto min-w-[260px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {versions.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.label} — {v.effectiveDate}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ActiveComponent />
    </>
  )
}

export default LegalDocVersions
