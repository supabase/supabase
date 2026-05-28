'use client'

import { StatusIcon } from 'ui'

import { IllustrationFrame } from './IllustrationFrame'
import { NotificationsStack, type NotificationStackItem } from './NotificationsStack'

const GRAY_BADGE = 'border-default bg-surface-300 text-foreground-light'

const DB_CHANGE_ITEMS: NotificationStackItem[] = [
  {
    id: 'insert-users',
    badge: 'INSERT',
    badgeClassName: GRAY_BADGE,
    title: 'public.users',
    description: 'New row added via Realtime',
    icon: <StatusIcon variant="default" className="size-4" hideBackground />,
  },
  {
    id: 'update-messages',
    badge: 'UPDATE',
    badgeClassName: GRAY_BADGE,
    title: 'public.messages',
    description: 'Row modified in channel events',
    icon: <StatusIcon variant="default" className="size-4" hideBackground />,
  },
  {
    id: 'delete-sessions',
    badge: 'DELETE',
    badgeClassName: GRAY_BADGE,
    title: 'public.sessions',
    description: 'Row removed from table',
    icon: <StatusIcon variant="default" className="size-4" hideBackground />,
  },
  {
    id: 'insert-orders',
    badge: 'INSERT',
    badgeClassName: GRAY_BADGE,
    title: 'public.orders',
    description: 'Checkout completed on mobile',
    icon: <StatusIcon variant="default" className="size-4" hideBackground />,
  },
  {
    id: 'update-profiles',
    badge: 'UPDATE',
    badgeClassName: GRAY_BADGE,
    title: 'public.profiles',
    description: 'Avatar URL changed',
    icon: <StatusIcon variant="default" className="size-4" hideBackground />,
  },
  {
    id: 'delete-events',
    badge: 'DELETE',
    badgeClassName: GRAY_BADGE,
    title: 'public.events',
    description: 'Expired event cleaned up',
    icon: <StatusIcon variant="default" className="size-4" hideBackground />,
  },
]

export function DatabaseChangesIllustration() {
  return (
    <IllustrationFrame className="items-center justify-center">
      <NotificationsStack
        items={DB_CHANGE_ITEMS}
        skewY={-5}
        rotateX={0}
        rotateY={-3}
        rotateZ={5}
        spacing={1.6}
        className="relative z-10 scale-[1.6] px-4"
      />
    </IllustrationFrame>
  )
}
