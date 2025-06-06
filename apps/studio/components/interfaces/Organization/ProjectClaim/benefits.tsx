import { CheckCircle2, ChevronsLeftRight } from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'

import { ApiAuthorizationResponse } from 'data/api-authorization/api-authorization-query'
import { OrganizationProjectClaimResponse } from 'data/organizations/organization-project-claim-query'
import { BASE_PATH } from 'lib/constants'
import { Button, cn } from 'ui'
import { ProjectClaimLayout } from './layout'

export const ProjectClaimBenefits = ({
  projectClaim,
  requester,
  onContinue,
}: {
  projectClaim: OrganizationProjectClaimResponse
  requester: ApiAuthorizationResponse
  onContinue: () => void
}) => {
  const { resolvedTheme } = useTheme()

  return (
    <ProjectClaimLayout
      title={
        <>
          Claim a project <span className="text-brand">{projectClaim?.project?.name}</span> from{' '}
          <span className="text-brand">{requester?.name}</span>
        </>
      }
      description="Step 2 of 3"
    >
      <div className="space-y-8 text-sm flex flex-col items-center">
        <div className="flex flex-col items-center mt-6">
          <div className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 bg-center bg-no-repeat bg-cover flex items-center justify-center rounded-md'
              )}
              style={{
                backgroundImage: !!requester.icon ? `url('${requester.icon}')` : 'none',
              }}
            >
              {!requester.icon && (
                <p className="text-foreground-light text-lg">{requester.name[0]}</p>
              )}
            </div>

            <div className="flex items-center justify-center w-28 relative">
              <div className="h-0.5 w-full border-2 border-dashed border-stronger" />
              <div className="rounded-full border flex items-center justify-center h-10 w-full shadow-sm">
                <ChevronsLeftRight className="text-muted-foreground" size={24} />
              </div>
              <div className="h-0.5 w-full border-2 border-dashed border-stronger z-10" />
            </div>

            <div className="w-8 h-8">
              <Image
                src={
                  resolvedTheme?.includes('dark')
                    ? `${BASE_PATH}/img/supabase-logo.svg`
                    : `${BASE_PATH}/img/supabase-logo.svg`
                }
                alt="Supabase Logo"
                className="w-full h-full"
                width={100}
                height={100}
              />
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-center text-base text-foreground-light">
            Supabase will become the backend for{' '}
            <span className="text-foreground">{projectClaim?.project?.name}</span>.
          </h2>
          <p className="text-center text-foreground-lighter">
            Your backend will then be managed by Supabase.
          </p>
        </div>
        <div className="space-y-4">
          <h3 className="">Why manage your backend on Supabase?</h3>
          <ul className="space-y-3">
            <li className="flex space-x-2">
              <CheckCircle2 className="text-brand w-5 h-5" />
              <span>
                <span className="text-foreground-light">Excellent Technical Support</span>
                <span className="block text-foreground-lighter">
                  Get expert help when you need it, with support ready to assist your development
                  process.
                </span>
              </span>
            </li>
            <li className="flex space-x-2">
              <CheckCircle2 className="text-brand w-5 h-5" />
              <span>
                <span className="text-foreground-light">Unrestricted usage.</span>
                <span className="block text-foreground-lighter">
                  Grow your application without hitting arbitrary usage caps—built to scale with
                  you.
                </span>
              </span>
            </li>
            <li className="flex space-x-2">
              <CheckCircle2 className="text-brand w-5 h-5" />
              <span>
                <span className="text-foreground-light">Unrestricted usage.</span>
                <span className="block text-foreground-lighter">
                  Scale your project as your users grow.
                </span>
              </span>
            </li>
            <li className="flex space-x-2">
              <CheckCircle2 className="text-brand w-5 h-5" />
              <span>
                <span className="text-foreground-light">Compute upgrades</span>
                <span className="block text-foreground-lighter">Handle larger database loads</span>
              </span>
            </li>
            ✅ Open Source Use and contribute to a fully open-source platform with the flexibility
            to self-host for greater control and transparency. ✅ PostgreSQL Foundation Build on top
            of a battle-tested relational database with rich querying capabilities and full SQL
            support. ✅ Real-time Updates Get instant data synchronization across clients using
            PostgreSQL's replication features—ideal for collaborative and live apps. ✅
            Authentication Built-in Manage users securely with built-in authentication, including
            social logins, passwordless, and row-level security. ✅ Auto-generated APIs Skip
            boilerplate. Supabase creates REST and GraphQL APIs for your database automatically. ✅
            Scalable Storage Store and serve images, videos, and other assets with a simple,
            integrated object storage system. ✅ Easy Compute Scaling Upgrade compute resources to
            handle increased traffic and larger database operations smoothly. ✅ Unrestricted Usage
            Grow your application without hitting arbitrary usage caps—built to scale with you.
            ✅Technical Support Get expert help when you need it, with support ready to assist your
            development process.
          </ul>
        </div>
        <div className="flex justify-center sticky bottom-0">
          <Button size="medium" onClick={onContinue}>
            Continue connection
          </Button>
        </div>
      </div>
    </ProjectClaimLayout>
  )
}
