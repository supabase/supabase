import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/registry/default/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/default/components/ui/tooltip'

const avatarStackVariants = cva('flex -space-x-4 -space-y-4', {
  variants: {
    orientation: {
      vertical: 'flex-row',
      horizontal: 'flex-col',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
  },
})

export interface AvatarStackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarStackVariants> {
  avatars: { name: string; image: string }[]
  maxAvatarsAmount?: number
}

const AvatarStack = ({
  className,
  orientation,
  avatars,
  maxAvatarsAmount = 3,
  ...props
}: AvatarStackProps) => {
  const shownAvatars = avatars.slice(0, maxAvatarsAmount)
  const hiddenAvatars = avatars.slice(maxAvatarsAmount)

  return (
    <div
      className={cn(
        avatarStackVariants({ orientation }),
        className,
        orientation === 'horizontal' ? '-space-x-0' : '-space-y-0'
      )}
      {...props}
    >
      {shownAvatars.map(({ name, image }, index) => (
        <Tooltip key={`${name}-${image}-${index}`}>
          <TooltipTrigger asChild>
            <Avatar className="hover:z-10">
              <AvatarImage src={image} />
              <AvatarFallback>
                {name
                  ?.split(' ')
                  ?.map((word) => word[0])
                  ?.join('')
                  ?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            <p>{name}</p>
          </TooltipContent>
        </Tooltip>
      ))}

      {hiddenAvatars.length ? (
        <Tooltip key="hidden-avatars">
          <TooltipTrigger asChild>
            <Avatar>
              <AvatarFallback>+{avatars.length - shownAvatars.length}</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            {hiddenAvatars.map(({ name }, index) => (
              <p key={`${name}-${index}`}>{name}</p>
            ))}
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}

export { AvatarStack, avatarStackVariants }
