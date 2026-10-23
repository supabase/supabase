import { LightbulbIcon } from 'lucide-react'
import { AiIconAnimation, cn } from 'ui'

import { ProfileImage } from '@/components/ui/ProfileImage'
import type { IssueActor } from '@/data/issues/issue-schema'

const SIZE_CLASSES = {
  sm: 'size-4 text-[9px]',
  md: 'size-6 text-[11px]',
}

const ICON_SIZES = { sm: 10, md: 14 }
// A square reads larger than a circle of the same size, so the larger icon is inset a little
const ASSISTANT_ICON_SIZES = { sm: 16, md: 20 }

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

/** People are round, agents and Supabase itself are square, so it's clear at a glance who acted. */
export const IssueActorAvatar = ({
  actor,
  size = 'md',
  className,
}: {
  actor: IssueActor
  size?: keyof typeof SIZE_CLASSES
  className?: string
}) => {
  const sizeClassName = SIZE_CLASSES[size]

  // The Assistant's icon draws its own frame, so it fills the avatar box without one
  if (actor.type === 'assistant') {
    return (
      <span
        aria-hidden
        className={cn('flex shrink-0 items-center justify-center', sizeClassName, className)}
      >
        <AiIconAnimation size={ASSISTANT_ICON_SIZES[size]} />
      </span>
    )
  }

  if (actor.type === 'system') {
    return (
      <span
        aria-hidden
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md border bg-secondary text-foreground-light',
          sizeClassName,
          className
        )}
      >
        <LightbulbIcon size={ICON_SIZES[size]} strokeWidth={2} />
      </span>
    )
  }

  return (
    <ProfileImage
      alt=""
      src={actor.avatar_url ?? undefined}
      className={cn('shrink-0', sizeClassName, className)}
      placeholder={
        <span
          aria-hidden
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full bg-secondary font-medium text-foreground-light',
            sizeClassName,
            className
          )}
        >
          {getInitials(actor.name)}
        </span>
      }
    />
  )
}
