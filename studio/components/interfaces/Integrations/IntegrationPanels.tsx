import dayjs from 'dayjs'
import Image from 'next/image'
import React from 'react'

import { Markdown } from 'components/interfaces/Markdown'
import { Integration, IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { useProjectsQuery } from 'data/projects/projects-query'
import { BASE_PATH } from 'lib/constants'
import { getVercelConfigurationUrl } from 'lib/integration-utils'
import { Badge, Button, IconArrowRight, IconExternalLink, IconGitHub, IconSquare, cn } from 'ui'

const ICON_STROKE_WIDTH = 2
const ICON_SIZE = 14

export interface IntegrationInstallationProps extends React.RefAttributes<HTMLLIElement> {
  title: string
  integration: Integration
}

type HandleIconType = Integration['integration']['name'] | 'Supabase'

const HandleIcon = ({ type, className }: { type: HandleIconType; className?: string }) => {
  switch (type) {
    case 'GitHub':
      return <IconGitHub strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />
      break
    case 'Netlify':
      return <IconSquare strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />
      break
    case 'Vercel':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="white"
          viewBox="0 0 512 512"
          className={cn('w-3.5', className)}
        >
          <path fillRule="evenodd" d="M256,48,496,464H16Z" />
        </svg>
      )

      break
    case 'Supabase':
      return <img src={`${BASE_PATH}/img/supabase-logo.svg`} alt="Supabase" className="w-3.5"></img>
      break

    default:
      return <></>
      break
  }
}

const Avatar = ({ src }: { src: string | undefined }) => {
  return (
    <div className="relative border shadow-lg w-8 h-8 rounded-full overflow-hidden">
      <Image
        src={src || ''}
        width={30}
        height={30}
        layout="fill"
        alt="avatar"
        className="relative"
      />
    </div>
  )
}

const IntegrationInstallation = React.forwardRef<HTMLLIElement, IntegrationInstallationProps>(
  ({ title, integration, ...props }, ref) => {
    const IntegrationIconBlock = () => {
      return (
        <div className="bg-black text-white w-8 h-8 rounded flex items-center justify-center">
          <HandleIcon type={integration.integration.name} />
        </div>
      )
    }

    return (
      <li
        ref={ref}
        key={integration.id}
        className="bg-surface-100 border shadow-sm flex justify-between items-center px-8 py-4 rounded-lg"
        {...props}
      >
        <div className="flex gap-6 items-center">
          <div className="flex gap-3 items-center">
            <div className="flex -space-x-1">
              <IntegrationIconBlock />
              <Avatar src={integration?.metadata?.account.avatar} />
            </div>
          </div>
          <div className="flex flex-col gap-0">
            <div className="flex items-center gap-2">
              <span className="text-scale-1200 font-medium">
                {/* {title} integration connection •{' '} */}
                {integration.metadata?.account.name || integration.metadata?.gitHubConnectionOwner}
              </span>

              <Badge color="scale" className="capitalize">
                {integration.metadata?.account.type}
              </Badge>
            </div>
            <div className="flex flex-col gap-0">
              <span className="text-scale-900 text-sm">
                Created {dayjs(integration.inserted_at).fromNow()}
              </span>
              <span className="text-scale-900 text-sm">
                Added by {integration?.added_by?.primary_email}
              </span>
            </div>
          </div>
        </div>

        <Button type="default" asChild iconRight={<IconExternalLink />}>
          {/* hard coded to vercel for now, TODO: move to a prop */}
          <a
            href={getVercelConfigurationUrl(integration)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Manage
          </a>
        </Button>
      </li>
    )
  }
)

export interface IntegrationConnectionProps extends React.HTMLAttributes<HTMLLIElement> {
  connection: IntegrationProjectConnection
  type: Integration['integration']['name']
  actions?: React.ReactNode
}

const IntegrationConnection = React.forwardRef<HTMLLIElement, IntegrationConnectionProps>(
  ({ className, connection, type, actions, ...props }, ref) => {
    const { data: projects } = useProjectsQuery()
    const project = projects?.find((project) => project.ref === connection.supabase_project_ref)

    return (
      <li
        ref={ref}
        key={connection.id}
        {...props}
        className={cn('ml-6 pl-8 pb-2 border-l border-scale-600 dark:border-scale-400', 'relative')}
      >
        <div className="absolute w-8 rounded-bl-full border-b border-l border-scale-600 dark:border-scale-400 h-10 -left-px"></div>
        <div className="bg-surface-100 border shadow-sm flex justify-between items-center px-8 py-4 rounded-lg">
          <div className="flex flex-col gap-1">
            <div className="flex gap-2 items-center">
              <HandleIcon type={'Supabase'} />
              <span>{project?.name}</span>
              <IconArrowRight size={14} className="text-scale-900" strokeWidth={1.5} />
              {!connection?.metadata?.framework ? (
                <div className="bg-black text-white w-4 h-4 rounded flex items-center justify-center">
                  <HandleIcon type={'Vercel'} className={'!w-2.5'} />
                </div>
              ) : (
                <img
                  src={`${BASE_PATH}/img/icons/frameworks/${connection.metadata.framework}.svg`}
                  width={21}
                  height={21}
                  alt={`icon`}
                />
              )}
              <span>{connection.metadata?.name}</span>
            </div>

            <div className="flex flex-col gap-0">
              <span className="text-scale-900 text-sm">
                Connected {dayjs(connection?.inserted_at).fromNow()}
              </span>
              <span className="text-scale-900 text-sm">
                Added by {connection?.added_by?.primary_email}
              </span>
            </div>
          </div>

          <div>{actions}</div>
        </div>
      </li>
    )
  }
)

const IntegrationConnectionOption = React.forwardRef<HTMLLIElement, IntegrationConnectionProps>(
  ({ className, connection, type, ...props }, ref) => {
    const { data: projects } = useProjectsQuery()
    const project = projects?.find((project) => project.ref === connection.supabase_project_ref)

    return (
      <li
        ref={ref}
        key={connection.id}
        {...props}
        className={cn(
          'bg-surface-100 border shadow-sm flex justify-between items-center px-8 py-4 rounded-lg'
        )}
      >
        <div className="flex flex-col gap-1">
          <div className="flex gap-2 items-center">
            <HandleIcon type={'Supabase'} />
            <span>{project?.name}</span>
            <IconArrowRight size={14} className="text-scale-900" strokeWidth={1.5} />
            <HandleIcon type={type} />
            <span>{connection.metadata.name}</span>
          </div>

          <span className="text-scale-900 text-sm">
            Connected {dayjs(connection.inserted_at).fromNow()}
          </span>
        </div>

        <Button type="default">Connect</Button>
      </li>
    )
  }
)

const EmptyIntegrationConnection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      className={cn('ml-6 pl-8 pb-2 border-l', 'last:border-l-transparent', 'relative', className)}
    >
      <div className="absolute w-8 rounded-bl-full border-b border-l border-scale-600 dark:border-scale-400 h-10 -left-px"></div>
      <div
        className={cn(
          'w-full',
          'border border-dashed bg-scale-300 dark:bg-scale-100 border-scale-600 dark:border-scale-400',
          '',
          'flex h-20 px-10 rounded-lg justify-center items-center'
        )}
      >
        <Button type="default">Add new project connection</Button>
      </div>
    </div>
  )
})

interface IntegrationConnectionHeader extends React.HTMLAttributes<HTMLDivElement> {
  name?: string
  markdown?: string
}

const IntegrationConnectionHeader = React.forwardRef<HTMLDivElement, IntegrationConnectionHeader>(
  ({ className, name, markdown = '', ...props }, ref) => {
    return (
      <div
        {...props}
        ref={ref}
        className={cn(
          'border-l border-scale-600 dark:border-scale-400 ml-6 pl-8 pt-6 pb-3',
          className
        )}
      >
        <Markdown content={markdown} className="" />
      </div>
    )
  }
)

IntegrationInstallation.displayName = 'IntegrationInstallation'
IntegrationConnection.displayName = 'IntegrationConnection'
IntegrationConnectionHeader.displayName = 'IntegrationConnectionHeader'
EmptyIntegrationConnection.displayName = 'EmptyIntegrationConnection'
IntegrationConnectionOption.displayName = 'IntegrationConnectionOption'

export {
  EmptyIntegrationConnection,
  IntegrationConnection,
  IntegrationConnectionHeader,
  IntegrationConnectionOption,
  IntegrationInstallation,
}
