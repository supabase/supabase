'use client'

import { useParams, usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useConfig } from '@/src/hooks/use-config'

export default function RedirectCatcher() {
  const asPath = usePathname()
  const router = useRouter()
  const [config, setConfig] = useConfig()
  const { selectedOrg, selectedProject } = config
  const { org, project } = useParams()

  useEffect(() => {
    if (
      selectedOrg?.key &&
      selectedProject?.key &&
      // (selectedOrg?.key !== org || selectedProject.key !== project)
      selectedOrg.key === org
    ) {
      // Construct the new URL with the updated parameters
      const newUrl = asPath
        .replace(`/${org}`, `/${selectedOrg?.key}`)
        .replace(`/${project}`, `/${selectedProject.key}`)

      // Navigate to the new URL
      router.push(newUrl)
    }
  }, [selectedOrg?.key, selectedProject?.key, org, project, asPath, router])

  // useEffect(() => {
  //   if (selectedOrg?.key) {
  //     // Construct the new URL with the updated parameters

  //     // Navigate to the new URL
  //     router.push(`/${selectedOrg.key}/projects`)
  //   }
  // }, [selectedOrg?.key])

  return <></>
}
