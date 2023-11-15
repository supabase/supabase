import dayjs from 'dayjs'
import Image from 'next/legacy/image'
import React from 'react'

import { Markdown } from 'components/interfaces/Markdown'
import { Integration, IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { useProjectsQuery } from 'data/projects/projects-query'
import { BASE_PATH } from 'lib/constants'
import { getIntegrationConfigurationUrl } from 'lib/integration-utils'
import Link from 'next/link'
import { Badge, Button, cn, IconArrowRight, IconExternalLink, IconGitHub } from 'ui'

const ICON_STROKE_WIDTH = 2
const ICON_SIZE = 14

export interface IntegrationInstallationProps extends React.RefAttributes<HTMLLIElement> {
  title: string
  integration: Integration
  disabled?: boolean
}

type HandleIconType = Integration['integration']['name'] | 'Supabase'

const HandleIcon = ({ type, className }: { type: HandleIconType; className?: string }) => {
  switch (type) {
    case 'GitHub':
      return <IconGitHub strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />
      break
    // case 'Netlify':
    //   return <IconSquare strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />
    //   break
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
  ({ title, integration, disabled, ...props }, ref) => {
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
              <span className="text-foreground text-sm font-medium">
                {integration.metadata?.account.name ||
                  (integration.metadata !== undefined &&
                    'gitHubConnectionOwner' in integration.metadata &&
                    integration.metadata?.gitHubConnectionOwner)}
              </span>

              <Badge color="scale" className="capitalize">
                {integration.metadata?.account.type}
              </Badge>
            </div>
            <div className="flex flex-col gap-0">
              <span className="text-foreground-lighter text-xs">
                Created {dayjs(integration.inserted_at).fromNow()}
              </span>
              <span className="text-foreground-lighter text-xs">
                Added by {integration?.added_by?.primary_email}
              </span>
            </div>
          </div>
        </div>

        <Button asChild disabled={disabled} type="default" iconRight={<IconExternalLink />}>
          {disabled ? (
            <p>Manage</p>
          ) : (
            <Link
              href={getIntegrationConfigurationUrl(integration)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Manage
            </Link>
          )}
        </Button>
      </li>
    )
  }
)

export interface IntegrationConnectionProps extends React.HTMLAttributes<HTMLLIElement> {
  connection: IntegrationProjectConnection
  type: Integration['integration']['name']
  actions?: React.ReactNode
  showNode?: boolean
  orientation?: 'horizontal' | 'vertical'
}

const IntegrationConnection = React.forwardRef<HTMLLIElement, IntegrationConnectionProps>(
  (
    { connection, type, actions, showNode = true, orientation = 'horizontal', className, ...props },
    ref
  ) => {
    const { data: projects } = useProjectsQuery()
    const project = projects?.find((project) => project.ref === connection.supabase_project_ref)

    return (
      <li
        ref={ref}
        key={connection.id}
        {...props}
        className={cn(showNode && 'pl-8 ml-6 border-l border-muted', 'pb-2', 'relative')}
      >
        {showNode && (
          <div className="absolute w-8 rounded-bl-full border-b border-l border-muted h-10 -left-px"></div>
        )}
        <div
          className={cn(
            orientation === 'horizontal'
              ? 'flex items-center justify-between'
              : 'flex flex-col gap-3',
            'bg-surface-100 border shadow-sm px-8 py-4 rounded-lg',
            className
          )}
        >
          <div className={'flex flex-col gap-1'}>
            <div className="flex gap-2 items-center">
              <HandleIcon type={'Supabase'} />
              <span className="text-sm">{project?.name}</span>
              <IconArrowRight size={14} className="text-foreground-lighter" strokeWidth={1.5} />
              {!connection?.metadata?.framework ? (
                <div className="bg-black text-white w-4 h-4 rounded flex items-center justify-center">
                  <HandleIcon type={type} className={'!w-2.5'} />
                </div>
              ) : (
                <img
                  src={`${BASE_PATH}/img/icons/frameworks/${connection.metadata.framework}.svg`}
                  width={21}
                  height={21}
                  alt={`icon`}
                />
              )}
              <span className="text-sm truncate">{connection.metadata?.name}</span>
            </div>

            <div className="flex flex-col gap-0">
              <span className="text-foreground-lighter text-xs">
                Connected {dayjs(connection?.inserted_at).fromNow()}
              </span>
              <span className="text-foreground-lighter text-xs">
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
            <span className="text-sm">{project?.name}</span>
            <IconArrowRight size={14} className="text-foreground-lighter" strokeWidth={1.5} />
            <HandleIcon type={type} />
            <span className="text-sm">{connection.metadata.name}</span>
          </div>

          <span className="text-foreground-lighter text-xs">
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
  React.HTMLAttributes<HTMLDivElement> & {
    showNode?: boolean
    orgSlug?: string
    onClick: () => void
  }
>(({ className, showNode = true, orgSlug = '_', onClick, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        showNode && 'ml-6 pl-8  border-l',
        'pb-2 ',
        'last:border-l-transparent',
        'relative',
        className
      )}
    >
      {showNode && (
        <div className="absolute w-8 rounded-bl-full border-b border-l border-muted h-10 -left-px"></div>
      )}
      <div
        className={cn(
          'w-full',
          'border border-dashed bg-surface-100 border-overlay',
          '',
          'flex h-20 px-10 rounded-lg justify-center items-center'
        )}
      >
        <Button type="default" onClick={() => onClick()}>
          Add new project connection
        </Button>
      </div>
    </div>
  )
})

interface IntegrationConnectionHeader extends React.HTMLAttributes<HTMLDivElement> {
  name?: string
  markdown?: string
  showNode?: boolean
}

const IntegrationConnectionHeader = React.forwardRef<HTMLDivElement, IntegrationConnectionHeader>(
  ({ className, name, markdown = '', showNode = true, ...props }, ref) => {
    return (
      <div
        {...props}
        ref={ref}
        className={cn(
          showNode && 'border-l border-muted ml-6 pl-8',
          'pt-6 pb-3',
          'prose text-sm',
          className
        )}
      >
        {props.title && <h5 className="text-foreground">{props.title}</h5>}
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
