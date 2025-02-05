import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'common'
import type { NextPageWithLayout } from 'types'

const ProjectSettings: NextPageWithLayout = () => {
  const { ref } = useParams() as { ref: string }

  return (
    <ProductEmptyState title="Authentication settings have moved">
      <div className="text-sm">
        <p className="text-foreground-light mb-4">
          We have moved all settings under configuration within the Authentication page.
        </p>
        <Link
          href={`/project/${ref}/auth/providers`}
          className="block py-2 hover:text-foreground border-b flex items-center justify-between"
        >
          General user signup
          <ChevronRight strokeWidth={1.5} size={16} />
        </Link>
        <Link
          href={`/project/${ref}/auth/providers`}
          className="block py-2 hover:text-foreground border-b flex items-center justify-between"
        >
          Password settings in email provider
          <ChevronRight strokeWidth={1.5} size={16} />
        </Link>
        <Link
          href={`/project/${ref}/auth/sessions`}
          className="block py-2 hover:text-foreground border-b flex items-center justify-between"
        >
          User sessions and refresh tokens
          <ChevronRight strokeWidth={1.5} size={16} />
        </Link>
        <Link
          href={`/project/${ref}/auth/protection`}
          className="block py-2 hover:text-foreground border-b flex items-center justify-between"
        >
          Bot and abuse protection
          <ChevronRight strokeWidth={1.5} size={16} />
        </Link>
        <Link
          href={`/project/${ref}/auth/smtp`}
          className="block py-2 hover:text-foreground border-b flex items-center justify-between"
        >
          SMTP settings
          <ChevronRight strokeWidth={1.5} size={16} />
        </Link>
        <Link
          href={`/project/${ref}/settings/api`}
          className="block py-2 hover:text-foreground border-b flex items-center justify-between"
        >
          Access token expiry
          <ChevronRight strokeWidth={1.5} size={16} />
        </Link>
        <Link
          href={`/project/${ref}/auth/mfa`}
          className="block py-2 hover:text-foreground border-b flex items-center justify-between"
        >
          Multi-factor authentication
          <ChevronRight strokeWidth={1.5} size={16} />
        </Link>
        <Link
          href={`/project/${ref}/settings/database`}
          className="block py-2 hover:text-foreground border-b flex items-center justify-between"
        >
          Max request duration
          <ChevronRight strokeWidth={1.5} size={16} />
        </Link>
        <Link
          href={`/project/${ref}/auth/third-party`}
          className="block py-2 hover:text-foreground flex items-center justify-between"
        >
          Third party authentication
          <ChevronRight strokeWidth={1.5} size={16} />
        </Link>
      </div>
    </ProductEmptyState>
  )
}

ProjectSettings.getLayout = (page) => <SettingsLayout title="Authentication">{page}</SettingsLayout>

export default ProjectSettings
