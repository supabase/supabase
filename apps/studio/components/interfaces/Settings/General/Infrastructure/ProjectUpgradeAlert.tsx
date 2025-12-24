import { useFlag, useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useProjectUpgradeEligibilityQuery } from 'data/config/project-upgrade-eligibility-query'
import { DOCS_URL } from 'lib/constants'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

export const ProjectUpgradeAlert = () => {
  const { ref } = useParams()
  const projectUpgradeDisabled = useFlag('disableProjectUpgrade')

  const { data } = useProjectUpgradeEligibilityQuery({ projectRef: ref })
  const latestPgVersion =
    (data?.latest_app_version ?? '').split('supabase-postgres-')[1] ?? 'a newer version'

  return (
    <Admonition
      type="default"
      title="New Postgres version available"
      description={`Your project can be upgraded to ${latestPgVersion ? `Postgres ${latestPgVersion}` : 'the latest version of Postgres'}.`}
      actions={
        <>
          {projectUpgradeDisabled ? (
            <ButtonTooltip
              size="tiny"
              type="primary"
              disabled
              className="pointer-events-auto"
              tooltip={{
                content: {
                  side: 'bottom',
                  text: 'Postgres upgrade is currently disabled',
                },
              }}
            >
              Review upgrade
            </ButtonTooltip>
          ) : (
            <Button size="tiny" type="primary" asChild>
              <Link href={`/project/${ref}?upgrade=true`}>Review upgrade</Link>
            </Button>
          )}
          <Button type="default" asChild>
            <Link href={`${DOCS_URL}/guides/platform/upgrading#in-place-upgrades`}>Learn more</Link>
          </Button>
        </>
      }
    />
  )
}
