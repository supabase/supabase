import Link from 'next/link'
import { useRouter } from 'next/router'
import { Admonition } from 'ui'
import { useMenuActiveRefId } from '~/hooks/useMenuState'
import { ICommonSection } from './Reference.types'

export interface OldVersionAlertProps {
  sections: ICommonSection[]
}

const OldVersionAlert = ({ sections }: OldVersionAlertProps) => {
  const router = useRouter()
  const activeRefId = useMenuActiveRefId()

  const activeSection = sections.find(({ id }) => id === activeRefId)

  // Remove the version number from URL to get the latest
  const latestVersionUrl = router.asPath
    .split('/')
    .slice(0, -2)
    .concat(activeSection ? [activeSection.slug] : [])
    .join('/')

  return (
    <div className="sticky top-10 z-10 lg:top-14 lg:w-1/2">
      <Admonition type="caution">
        You&apos;re viewing an older version of this library.
        <br />
        <Link
          href={latestVersionUrl}
          className="underline decoration-brand-400 underline-offset-4 decoration-1"
        >
          Switch to the latest
        </Link>
        .
      </Admonition>
    </div>
  )
}

export default OldVersionAlert
