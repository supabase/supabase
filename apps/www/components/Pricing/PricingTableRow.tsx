import ProductIcon from 'components/ProductIcon'
import { Fragment, ReactNode } from 'react'
import { IconPricingIncludedCheck, IconPricingMinus } from './PricingIcons'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { FeatureKey } from 'shared-data/pricing'
import Link from 'next/link'

type PricingTooltips = {
  [key in FeatureKey]?: {
    main?: ReactNode
    pro?: ReactNode
    team?: ReactNode
    enterprise?: ReactNode
  }
}

export const pricingTooltips: PricingTooltips = {
  'database.dedicatedPostgresDatabase': {
    main: 'A Postgres database with no restrictions? You get it. No pseudo limited users, you are the postgres root user.  No caveats.',
  },
  'database.size': {
    main: 'Billing is based on the provisioned disk size. Paid plan projects get provisioned with 8 GB of disk by default and autoscale to 1.5x the size once you get close to the limit. The first 8 GB of disk per project comes with no additional fees.\nFree plan customers are limited to 500 MB database size per project.',
  },
  'database.advancedDiskConfig': {
    main: 'Supabase databases are backed by high performance SSD disks. The disk can be scaled up to 60 TB, 80,000 IOPS and 4,000 MB/s throughput.',
  },
  'database.automaticBackups': {
    main: 'Backups are entire copies of your database that can be restored in the future.',
    pro: '7 days of backup (if > 1 TB, contact for Enterprise pricing)',
    team: '14 days of backup (if > 1 TB, contact for Enterprise pricing)',
  },
  'database.pitr': {
    main: 'PITR cannot be applied retroactively, projects can only be rolled back to the point from which PITR has been applied.',
  },
  'database.pausing': {
    main: 'Projects that have no activity or API requests will be paused. They can be reactivated via the dashboard.',
  },
  'database.egress': {
    main: 'Billing is based on the total sum of all outgoing traffic (includes Database, Storage, Realtime, Auth, API, Edge Functions, Supavisor, Log Drains) in GB throughout your billing period. Excludes cache hits.',
  },
  'database.cachedEgress': {
    main: 'Billing is based on the total sum of any outgoing traffic (includes Database, Storage, API, Edge Functions) in GB throughout your billing period that is served from our CDN cache.',
  },
  'auth.totalUsers': {
    main: 'The maximum number of users your project can have',
  },
  'auth.maus': {
    main: 'Users who log in or refresh their token count towards MAU.\nBilling is based on the sum of distinct users requesting your API throughout the billing period. Resets every billing cycle.',
  },
  'auth.userDataOwnership': {
    main: 'Full ownership and access to the underlying user data including encrypted passwords.',
  },
  'auth.anonSignIns': {
    main: 'Anonymous user requests count towards MAU, just like a permanent user.',
  },

  'auth.basicMFA': {
    main: 'Multi-factor authentication (MFA), sometimes called two-factor authentication (2FA), using Time-based One Time Passwords (TOTP) via an Authenticator App.',
  },
  'auth.advancedMFAPhone': {
    main: 'Multi-factor authentication (MFA), sometimes called two-factor authentication (2FA), using SMS or WhatsApp messages.\nAdditional fees apply based on your provider.',
  },
  'auth.thirdPartyMAUs': {
    main: 'Users who use the Supabase platform through a third-party authentication provider (Firebase Auth, Auth0 or Cognito).\nBilling is based on the sum of distinct third-party users requesting your API through the billing period. Resets every billing cycle.',
  },
  'storage.size': {
    main: "The sum of all objects' size in your storage buckets.\nBilling is prorated down to the hour and will be displayed as GB-Hrs on your invoice.",
  },

  'storage.maxFileSize': {
    main: 'You can change the upload size in the dashboard',
  },
  'storage.cdn': {
    main: 'Assets in Storage are automatically cached on a CDN. With Smart CDN caching enabled, the CDN cache is automatically re-validated when the underlying asset changes. CDN caching is enabled across all plans and assets in the paid plans are cached via the Smart CDN.',
  },
  'storage.transformations': {
    main: 'We count all images that were transformed in the billing period, ignoring any transformations.\nUsage example: You transform one image with four different size transformations and another image with just a single transformation. It counts as two, as only two images were transformed.\nBilling is based on the count of (origin) images that used transformations throughout the billing period. Resets every billing cycle.',
  },
  'functions.invocations': {
    main: 'Billing is based on the sum of all invocations, independent of response status, throughout your billing period.',
  },
  'realtime.concurrentConnections': {
    main: 'Total number of successful connections. Connections attempts are not counted towards usage.\nBilling is based on the maximum amount of concurrent peak connections throughout your billing period.',
  },
  'realtime.messagesPerMonth': {
    main: "Count of messages going through Realtime. Includes database changes, broadcast and presence. \nUsage example: If you do a database change and 5 clients listen to that change via Realtime, that's 5 messages. If you broadcast a message and 4 clients listen to that, that's 5 messages (1 message sent, 4 received).\nBilling is based on the total amount of messages throughout your billing period.",
  },
  'security.logDrain': {
    main: 'Only events processed and sent to destinations are counted. Egress required to export logs count towards usage.\nEgress through Log Drains is rolled up into the unified egress and benefits from the unified egress quota.',
  },
  'security.hipaa': {
    main: 'Available as a paid add-on on Team Plan and above.',
  },

  'security.accessRoles': {
    main: (
      <span className="prose text-xs">
        Supabase provides granular access controls to manage permissions across your organizations
        and projects. Read more in our{' '}
        <Link href="/docs/guides/platform/access-control" target="_blank">
          docs
        </Link>
        .
      </span>
    ),
  },

  'security.customDomains': {
    enterprise: 'Volume discounts available.',
  },
}

export const PricingTableRowDesktop = (props: any) => {
  const category = props.category

  return (
    <>
      <tr
        className="divide-border -scroll-mt-5"
        style={{ borderTop: 'none' }}
        id={`${props.sectionId}-desktop`}
      >
        <th
          className="bg-background text-foreground sticky top-[108px] xl:top-[84px] z-10 py-3 pl-6 text-left text-sm font-medium"
          scope="colgroup"
        >
          <div className="flex items-center gap-4">
            {props.icon && <ProductIcon icon={props.icon} color="green" />}
            <h4 className="m-0 text-base font-normal">{category.title}</h4>
          </div>
        </th>
        <td className="bg-background px-6 py-5 free"></td>
        <td className="bg-background px-6 py-5 pro"></td>
        <td className="bg-background px-6 py-5 team"></td>
        <td className="bg-background px-6 py-5 enterprise"></td>
      </tr>

      {category.features.map((feat: any, i: number) => {
        const tooltips = pricingTooltips[feat.key as FeatureKey]

        return (
          <Fragment key={feat.title}>
            <tr className="divide-border" key={i}>
              <th
                className={`text-foreground flex items-center px-6 py-5 last:pb-24 text-left text-xs font-normal `}
                scope="row"
              >
                <span className="mr-1">{feat.title}</span>
                {tooltips?.main && (
                  <InfoTooltip side="top" className="max-w-[250px]">
                    {tooltips.main}
                  </InfoTooltip>
                )}
              </th>

              {Object.entries(feat.plans).map((entry: any, i) => {
                const planName = entry[0] as 'pro' | 'team' | 'enterprise'
                const planValue = entry[1]

                return (
                  <td
                    key={i}
                    className={[
                      `pl-6 pr-2 tier-${planName}`,
                      typeof planValue === 'boolean' ? 'text-center' : '',
                    ].join(' ')}
                  >
                    {typeof planValue === 'boolean' && planValue === true ? (
                      <IconPricingIncludedCheck plan={planValue} />
                    ) : typeof planValue === 'boolean' && planValue === false ? (
                      <div className="text-muted">
                        <IconPricingMinus plan={planValue} />
                      </div>
                    ) : (
                      <div className="text-foreground text-xs flex flex-col justify-center">
                        <span className="flex items-center gap-2">
                          {tooltips?.[planName] && (
                            <InfoTooltip side="top" className="max-w-[250px]">
                              {tooltips[planName]}
                            </InfoTooltip>
                          )}
                          {typeof planValue === 'string' ? planValue : planValue[0]}
                        </span>
                        {Array.isArray(planValue) &&
                          planValue.slice(1).map((val, idx) => (
                            <span key={`planval_${i}_${idx}`} className="text-lighter leading-4">
                              {val}
                            </span>
                          ))}
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
            {i === category.features.length - 1 && (
              <tr className="my-16 bg-green-400 border-none"></tr>
            )}
          </Fragment>
        )
      })}
    </>
  )
}

export const PricingTableRowMobile = (props: any) => {
  const category = props.category
  const plan = props.plan

  return (
    <table className="mt-8 w-full -scroll-mt-5" id={`${props.sectionId}-mobile`}>
      <caption className="bg-background border-default border-t px-4 py-3 text-left text-sm font-medium text-foreground">
        <span className="flex items-center gap-2">
          {category.icon ? <ProductIcon icon={props.icon} /> : null}
          <span className="text-foreground font-normal">{category.title}</span>
        </span>
      </caption>
      <thead>
        <tr>
          <th className="sr-only" scope="col">
            Feature
          </th>
          <th className="sr-only" scope="col">
            Included
          </th>
        </tr>
      </thead>
      <tbody className="divide-border-default divide-y">
        {category.features.map((feat: any, i: number) => {
          return (
            <tr key={i} className="border-default border-t">
              <th
                className="text-foreground-light px-4 py-3 text-left text-sm font-normal"
                scope="row"
              >
                <p>{feat.title}</p>
              </th>
              <td className="py-3 pr-4 text-right">
                {typeof feat.plans[plan] === 'boolean' && feat.plans[plan] === true ? (
                  <span className="inline-block">
                    <IconPricingIncludedCheck plan={plan} />
                  </span>
                ) : typeof feat.plans[plan] === 'boolean' && feat.plans[plan] === false ? (
                  <span className="inline-block">
                    <IconPricingMinus plan={plan} />
                  </span>
                ) : (
                  <span className="text-foreground flex flex-col text-sm">
                    <span>
                      {typeof feat.plans[plan] === 'string'
                        ? feat.plans[plan]
                        : feat.plans[plan][0]}
                    </span>
                    {Array.isArray(feat.plans[plan]) &&
                      feat.plans[plan].slice(1).map((val, idx) => (
                        <span key={`planval_mobile_${i}_${idx}`} className="text-lighter leading-5">
                          {val}
                        </span>
                      ))}
                  </span>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
