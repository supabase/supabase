import { Integration, IntegrationProjectConnection } from 'data/integrations/integrations-query'
import dayjs from 'dayjs'
import React from 'react'
import {
  Button,
  IconArrowRight,
  IconCloudLightning,
  IconGitHub,
  IconSquare,
  IconTriangle,
} from 'ui'
import { cn } from 'ui/src/utils/cn'

var relativeTime = require('dayjs/plugin/relativeTime')
dayjs.extend(relativeTime)

const ICON_STROKE_WIDTH = 2
const ICON_SIZE = 14
export interface IntegrationInstallationProps extends React.HTMLAttributes<HTMLLIElement> {
  title: string
  orgName: string
  connection: Integration
}

type HandleIconType = Integration['type'] | 'SUPABASE'

const HandleIcon = ({ type }: { type: HandleIconType }) => {
  switch (type) {
    case 'GITHUB':
      return <IconGitHub strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />
      break
    case 'NETLIFY':
      return <IconSquare strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />
      break
    case 'VERCEL':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="var(--colors-scale12)"
          viewBox="0 0 512 512"
          className="w-3.5"
        >
          <path fill-rule="evenodd" d="M256,48,496,464H16Z" />
        </svg>
      )

      // <IconTriangle strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />
      break
    case 'SUPABASE':
      return (
        <img
          src="/img/supabase-logo.svg"
          alt="Supabase"
          className="mx-auto w-3.5 cursor-pointer rounded"
        ></img>
      )
      // <IconCloudLightning strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />
      break

    default:
      return <></>
      break
  }
}

const IntegrationInstallation = React.forwardRef<HTMLLIElement, IntegrationInstallationProps>(
  ({ className, title, orgName, connection, ...props }, ref) => {
    const IntegrationIconBlock = () => {
      return (
        <div className="bg-scale-100 w-8 h-8 rounded flex items-center justify-center">
          <HandleIcon type={connection.type} />
        </div>
      )
    }

    return (
      <li
        key={connection.id}
        className="bg border shadow-sm flex justify-between items-center px-8 py-4 rounded-lg"
      >
        <div className="flex gap-6 items-center">
          <div className="flex gap-3 items-center">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-1100 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-900"></span>
            </span>
            <IntegrationIconBlock />
          </div>
          <div className="flex flex-col gap-0">
            <span className="text-scale-1200 font-medium">
              {title} integration connection •{' '}
              {connection.metadata?.vercelTeam || connection.metadata?.gitHubConnectionOwner}
            </span>
            <div className="flex gap-3 items-center">
              <span className="text-scale-900 text-sm">
                Created {dayjs(connection.createdAt).fromNow()}
              </span>
              <span className="text-scale-900 text-sm">Added by {connection.createdBy}</span>
            </div>
          </div>
        </div>

        <Button type="default">Manage</Button>
      </li>
    )
  }
)

export interface IntegrationConnectionProps extends React.HTMLAttributes<HTMLLIElement> {
  connection: IntegrationProjectConnection
  type: Integration['type']
}

const IntegrationConnection = React.forwardRef<HTMLLIElement, IntegrationConnectionProps>(
  ({ className, connection, type, ...props }, ref) => {
    return (
      <li
        ref={ref}
        key={connection.id}
        {...props}
        className={cn(
          'ml-6 pl-8 pb-2 border-l',
          // 'last:border-l-transparent',
          'relative'
        )}
      >
        <div className="absolute w-8 rounded-bl-full border-b border-l h-10 -left-px"></div>
        <div className="bg border shadow-sm flex justify-between items-center px-8 py-4 rounded-lg">
          <div className="flex flex-col gap-1">
            <div className="flex gap-2 items-center">
              <HandleIcon type={'SUPABASE'} />
              <span>{connection.from.name}</span>
              <IconArrowRight size={14} className="text-scale-900" strokeWidth={1.5} />
              <HandleIcon type={type} />
              <span>{connection.to.name}</span>
            </div>

            <span className="text-scale-900 text-sm">
              Connected {dayjs(connection.createdAt).fromNow()}
            </span>
          </div>

          <div>
            <Button type="default">Disconnect</Button>
          </div>
        </div>
      </li>
    )
  }
)

const IntegrationConnectionOption = React.forwardRef<HTMLLIElement, IntegrationConnectionProps>(
  ({ className, connection, type, ...props }, ref) => {
    return (
      <li
        ref={ref}
        key={connection.id}
        {...props}
        className={cn('bg border shadow-sm flex justify-between items-center px-8 py-4 rounded-lg')}
      >
        <div className="flex flex-col gap-1">
          <div className="flex gap-2 items-center">
            <HandleIcon type={'SUPABASE'} />
            <span>{connection.from.name}</span>
            <IconArrowRight size={14} className="text-scale-900" strokeWidth={1.5} />
            <HandleIcon type={type} />
            <span>{connection.to.name}</span>
          </div>

          <span className="text-scale-900 text-sm">
            Connected {dayjs(connection.createdAt).fromNow()}
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
    <div ref={ref} {...props} className={cn('mt-0 ml-14', className)}>
      <div
        {...props}
        ref={ref}
        className={cn(
          'w-full',
          'border border-dashed',
          '',
          'flex h-20 px-10 rounded-lg justify-center items-center',
          className
        )}
      >
        <Button type="default">Add new project connection</Button>
      </div>
    </div>
  )
})

interface IntegrationConnectionHeader extends React.HTMLAttributes<HTMLDivElement> {
  name?: string
}

const IntegrationConnectionHeader = React.forwardRef<HTMLDivElement, IntegrationConnectionHeader>(
  ({ className, name, ...props }, ref) => {
    return (
      <div {...props} ref={ref} className={cn('border-l ml-6 pl-8 pt-6 pb-2', className)}>
        <h3>{props.title}</h3>
        <p className="text-scale-1100 text-sm">
          Repository connections for <span className="capitalize">{name?.toLowerCase()}</span>
        </p>
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
  IntegrationInstallation,
  IntegrationConnectionOption,
}
