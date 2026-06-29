import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { SimpleConfigurationDetails } from './SimpleConfigurationDetails'
import { WrapperMeta } from '@/components/interfaces/Integrations/Wrappers/Wrappers.types'
import { ScaffoldSection } from '@/components/layouts/Scaffold'
import { InlineLink } from '@/components/ui/InlineLink'
import { DatabaseExtension } from '@/data/database-extensions/database-extensions-query'
import { useIcebergWrapperCreateMutation } from '@/data/storage/iceberg-wrapper-create-mutation'
import { DOCS_URL } from '@/lib/constants'
import { isLessThan } from '@/lib/semver'

export const ExtensionNotInstalled = ({
  bucketName,
  projectRef,
  wrapperMeta,
  wrappersExtension,
}: {
  bucketName?: string
  projectRef: string
  wrapperMeta: WrapperMeta
  wrappersExtension: DatabaseExtension
}) => {
  const databaseNeedsUpgrading = isLessThan(
    wrappersExtension?.default_version ?? '',
    wrapperMeta?.minimumExtensionVersion ?? ''
  )

  return (
    <>
      <ScaffoldSection isFullWidth>
        <Admonition type="warning" title="Missing required extension">
          <p>
            The Wrappers extension is required in order to query analytics tables.{' '}
            {databaseNeedsUpgrading &&
              'Please first upgrade your database and then install the extension.'}{' '}
            <InlineLink
              href={`${DOCS_URL}/guides/database/extensions/wrappers/iceberg`}
              target="_blank"
              rel="noreferrer"
              className="text-foreground-lighter hover:text-foreground transition-colors"
            >
              Learn more
            </InlineLink>
          </p>
          <Button variant="default" asChild className="mt-2" onClick={() => {}}>
            <Link
              href={
                databaseNeedsUpgrading
                  ? `/project/${projectRef}/settings/infrastructure`
                  : `/project/${projectRef}/database/extensions?filter=wrappers`
              }
            >
              {databaseNeedsUpgrading ? 'Upgrade database' : 'Install extension'}
            </Link>
          </Button>
        </Admonition>
      </ScaffoldSection>
      <SimpleConfigurationDetails bucketName={bucketName} />
    </>
  )
}

export const ExtensionNeedsUpgrade = ({
  bucketName,
  projectRef,
  wrapperMeta,
  wrappersExtension,
}: {
  bucketName?: string
  projectRef: string
  wrapperMeta: WrapperMeta
  wrappersExtension: DatabaseExtension
}) => {
  // [Joshen] Default version is what's on the DB, so if the installed version is already the default version
  // but still doesnt meet the minimum extension version, then DB upgrade is required
  const databaseNeedsUpgrading =
    wrappersExtension?.installed_version === wrappersExtension?.default_version

  return (
    <>
      <ScaffoldSection isFullWidth>
        <Admonition type="warning" title="Outdated extension version">
          <p>
            The {wrapperMeta.label} wrapper requires a minimum extension version of{' '}
            {wrapperMeta.minimumExtensionVersion}. You have version{' '}
            {wrappersExtension?.installed_version} installed. Please{' '}
            {databaseNeedsUpgrading && 'first upgrade your database, and then '}update the extension
            by disabling and enabling the Wrappers extension.
          </p>
          <p>
            Before reinstalling the wrapper extension, you must first remove all existing wrappers.
            Afterward, you can recreate the wrappers.
          </p>
          <Button asChild variant="default">
            <Link
              href={
                databaseNeedsUpgrading
                  ? `/project/${projectRef}/settings/infrastructure`
                  : `/project/${projectRef}/database/extensions?filter=wrappers`
              }
            >
              {databaseNeedsUpgrading ? 'Upgrade database' : 'Extensions'}
            </Link>
          </Button>
        </Admonition>
      </ScaffoldSection>
      <SimpleConfigurationDetails bucketName={bucketName} />
    </>
  )
}

export const WrapperMissing = ({ bucketName }: { bucketName?: string }) => {
  const { mutateAsync: createIcebergWrapper, isPending: isCreatingIcebergWrapper } =
    useIcebergWrapperCreateMutation()

  const onSetupWrapper = async () => {
    if (!bucketName) return console.error('Bucket name is required')
    await createIcebergWrapper({ bucketName })
  }

  return (
    <>
      <ScaffoldSection isFullWidth>
        <Admonition type="warning" title="Missing integration">
          <p>The Iceberg Wrapper integration is required in order to query analytics tables.</p>
          <Button variant="default" loading={isCreatingIcebergWrapper} onClick={onSetupWrapper}>
            Install wrapper
          </Button>
        </Admonition>
      </ScaffoldSection>
      <SimpleConfigurationDetails bucketName={bucketName} />
    </>
  )
}
