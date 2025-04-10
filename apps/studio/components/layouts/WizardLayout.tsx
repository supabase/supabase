import Link from 'next/link'
import { PropsWithChildren } from 'react'

import { withAuth } from 'hooks/misc/withAuth'
import { BASE_PATH } from 'lib/constants'
import { ChevronRight } from 'lucide-react'
import type { Organization, Project } from 'types'
import { FeedbackDropdown } from './ProjectLayout/LayoutHeader/FeedbackDropdown'
import HelpPopover from './ProjectLayout/LayoutHeader/HelpPopover'

interface WizardLayoutProps {
  organization: Organization | null | undefined
  project: Project | null
}

const WizardLayout = ({
  organization,
  project,
  children,
}: PropsWithChildren<WizardLayoutProps>) => {
  return (
    <div className="flex w-full flex-col">
      <div className="overflow-auto">
        <section className="has-slide-in slide-in relative mx-auto my-10 max-w-2xl">
          {children}
        </section>
      </div>
    </div>
  )
}

export default withAuth(WizardLayout)

export const WizardLayoutWithoutAuth = WizardLayout
