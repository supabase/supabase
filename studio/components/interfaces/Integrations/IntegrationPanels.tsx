import { Markdown } from 'components/interfaces/Markdown'
import { Integration, IntegrationProjectConnection } from 'data/integrations/integrations-query'
import dayjs from 'dayjs'
import { useStore } from 'hooks'
import Image from 'next/image'

import React from 'react'

import { Badge, Button, IconArrowRight, IconGitHub, IconSquare, cn } from 'ui'

const ICON_STROKE_WIDTH = 2
const ICON_SIZE = 14
export interface IntegrationInstallationProps extends React.HTMLAttributes<HTMLLIElement> {
  title: string
  connection: Integration
}

type HandleIconType = Integration['integration']['name'] | 'Supabase'

const HandleIcon = ({ type }: { type: HandleIconType }) => {
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
          fill="var(--colors-scale12)"
          viewBox="0 0 512 512"
          className="w-3.5"
        >
          <path fill-rule="evenodd" d="M256,48,496,464H16Z" />
        </svg>
      )

      break
    case 'Supabase':
      return <img src="/img/supabase-logo.svg" alt="Supabase" className="w-3.5"></img>
      break

    default:
      return <></>
      break
  }
}

const Avatar = ({ src }: { src: string }) => {
  return (
    <div className="relative border shadow-lg w-8 h-8 rounded-full overflow-hidden">
      <Image src={src} width={30} height={30} layout="fill" alt="avatar" className="relative" />
    </div>
  )
}

const IntegrationInstallation = React.forwardRef<HTMLLIElement, IntegrationInstallationProps>(
  ({ className, title, connection, ...props }, ref) => {
    const IntegrationIconBlock = () => {
      return (
        <div className="bg-scale-100 w-8 h-8 rounded flex items-center justify-center">
          <HandleIcon type={connection.integration.name} />
        </div>
      )
    }

    console.log(connection)

    return (
      <li
        key={connection.id}
        className="bg border shadow-sm flex justify-between items-center px-8 py-4 rounded-lg"
      >
        <div className="flex gap-6 items-center">
          <div className="flex gap-3 items-center">
            {/* <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-1100 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-900"></span>
            </span> */}
            <div className="flex -space-x-1">
              <IntegrationIconBlock />
              <Avatar src={connection?.metadata?.account?.avatar} />
            </div>
          </div>
          <div className="flex flex-col gap-0">
            <div className="flex items-center gap-2">
              <span className="text-scale-1200 font-medium">
                {/* {title} integration connection •{' '} */}
                {connection.metadata?.account.name || connection.metadata?.gitHubConnectionOwner}
              </span>

              <Badge color="scale" className="capitalize">
                {connection.metadata.account.type}
              </Badge>
            </div>
            <div className="flex gap-3 items-center">
              <span className="text-scale-900 text-sm">
                Created {dayjs(connection.created_at).fromNow()}
              </span>
              <span className="text-scale-900 text-sm">
                Added by {connection?.added_by?.primary_email}
              </span>
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
  type: Integration['integration']['name']
  actions: React.ReactNode
}

const IntegrationConnection = React.forwardRef<HTMLLIElement, IntegrationConnectionProps>(
  ({ className, connection, type, actions, ...props }, ref) => {
    const { app } = useStore()

    const { projects } = app

    return (
      <li
        ref={ref}
        key={connection.id}
        {...props}
        className={cn('ml-6 pl-8 pb-2 border-l', 'relative')}
      >
        <div className="absolute w-8 rounded-bl-full border-b border-l h-10 -left-px"></div>
        <div className="bg border shadow-sm flex justify-between items-center px-8 py-4 rounded-lg">
          <div className="flex flex-col gap-1">
            <div className="flex gap-2 items-center">
              <HandleIcon type={'Supabase'} />
              <span>{projects.byId(connection.supabase_project_id)?.name}</span>
              <IconArrowRight size={14} className="text-scale-900" strokeWidth={1.5} />
              {!connection?.metadata?.framework ? (
                <HandleIcon type={type} />
              ) : (
                <img
                  src={`/img/icons/frameworks/${connection.metadata.framework}.svg`}
                  width={21}
                  height={21}
                  alt={`icon`}
                />
              )}
              <span>{connection.metadata?.name}</span>
            </div>

            <div className="flex gap-3 items-center">
              <span className="text-scale-900 text-sm">
                Connected {dayjs(connection?.created_at).fromNow()}
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
    const { app } = useStore()

    const { projects } = app
    return (
      <li
        ref={ref}
        key={connection.id}
        {...props}
        className={cn('bg border shadow-sm flex justify-between items-center px-8 py-4 rounded-lg')}
      >
        <div className="flex flex-col gap-1">
          <div className="flex gap-2 items-center">
            <HandleIcon type={'Supabase'} />
            <span>{projects.byId(connection.project_ref)?.name}</span>
            <IconArrowRight size={14} className="text-scale-900" strokeWidth={1.5} />
            <HandleIcon type={type} />
            <span>{connection.metadata.name}</span>
          </div>

          <span className="text-scale-900 text-sm">
            Connected {dayjs(connection.created_at).fromNow()}
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
      <div className="absolute w-8 rounded-bl-full border-b border-l h-10 -left-px"></div>
      <div
        className={cn(
          'w-full',
          'border border-dashed',
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
      <div {...props} ref={ref} className={cn('border-l ml-6 pl-8 pt-6 pb-3', className)}>
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
