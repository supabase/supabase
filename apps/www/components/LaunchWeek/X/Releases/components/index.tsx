import { IconDocumentation, IconMicSolid, IconProductHunt, IconYoutubeSolid, cn } from 'ui'

import Link from 'next/link'
import Image from 'next/image'
import { StepLink } from '../data/lwx_data'

export const CheckCircleSolidIcon = () => (
  <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M8.00156 14.7805C11.5362 14.7805 14.4016 11.9151 14.4016 8.38047C14.4016 4.84585 11.5362 1.98047 8.00156 1.98047C4.46694 1.98047 1.60156 4.84585 1.60156 8.38047C1.60156 11.9151 4.46694 14.7805 8.00156 14.7805ZM10.9672 7.34615C11.2797 7.03373 11.2797 6.5272 10.9672 6.21478C10.6548 5.90236 10.1483 5.90236 9.83588 6.21478L7.20156 8.8491L6.16725 7.81478C5.85483 7.50236 5.3483 7.50236 5.03588 7.81478C4.72346 8.1272 4.72346 8.63373 5.03588 8.94615L6.63588 10.5462C6.9483 10.8586 7.45483 10.8586 7.76725 10.5462L10.9672 7.34615Z"
      fill="currentColor"
    />
  </svg>
)

export const SmallCard = ({
  className,
  innerClassName,
  children,
}: {
  className?: string
  innerClassName?: string
  children: any
}) => (
  <div
    className={cn(
      'group relative p-[1px] bg-gradient-to-b from-[#11171890] to-[#1C1C1C60] rounded-2xl overflow-hidden shadow-lg',
      className
    )}
  >
    <div
      className={cn(
        'rounded-2xl text-sm text-[#9296AA] p-2 flex flex-row justify-between items-center backdrop-blur-md h-full',
        'bg-[#030A0C]',
        innerClassName
      )}
    >
      {children}
    </div>
  </div>
)

export const StyledArticleBadge = ({
  className,
  children,
}: {
  className?: string
  children: any
}) => (
  <div className={cn('relative bg-transparent border border-[#F4FFFA90] rounded-full', className)}>
    <div className="!bg-transparent rounded-full !py-1 !px-4 w-full inset-[1px] text-sm border-none from-foreground to-[#6453C5]">
      <span className="text-sm text-[#F4FFFA80] bg-clip-text bg-gradient-to-r from-[#F4FFFA] to-[#7E7AAD]">
        {children}
      </span>
      <div className="absolute inset-0 w-full h-full bg-[#1C1C1C] rounded-full blur-2xl" />
    </div>
  </div>
)

interface DayLink extends StepLink {
  className?: string
}

export const DayLink = ({ type, icon, text, href = '', className }: DayLink) => {
  const linkTypes = {
    docs: {
      icon: IconDocumentation,
      text: 'Docs',
    },
    productHunt: {
      icon: IconProductHunt,
      text: 'Product Hunt',
    },
    video: {
      icon: IconYoutubeSolid,
      text: 'Watch video',
    },
    xSpace: {
      icon: IconMicSolid,
      text: 'X Space',
    },
  }
  const isTargetBlank = () => {
    switch (type) {
      case 'productHunt':
      case 'docs':
        return true
    }
  }
  const Icon = icon ?? linkTypes[type].icon
  const Text = () => <>{text ?? linkTypes[type]?.text}</>

  return (
    <Link
      href={href}
      className={cn(
        'py-1 flex gap-2 items-center hover:text-foreground transition-colors text-sm',
        className
      )}
      target={isTargetBlank() ? '_blank' : '_self'}
    >
      <span className="w-4 h-4 flex items-center justify-center">
        <Icon />
      </span>
      <Text />
    </Link>
  )
}

export const VideoPreviewTrigger = ({
  title,
  thumbnail,
}: {
  title?: string
  thumbnail: string
}) => (
  <div className="flex items-center h-full gap-3 text-xs group/vid text-foreground-light hover:text-foreground transition-colors">
    <div className="relative h-10 !aspect-video flex items-center justify-center rounded overflow-hidden border border-foreground-lighter opacity-80 group-hover/vid:opacity-100 transition-colors">
      <div className="absolute z-10 w-2.5 h-2.5 text-white opacity-100">
        <svg viewBox="0 0 81 91" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M76.5621 37.998C82.3369 41.3321 82.3369 49.6673 76.5621 53.0014L13.2198 89.5721C7.44504 92.9062 0.226562 88.7386 0.226562 82.0704L0.226566 8.92901C0.226566 2.26085 7.44506 -1.90673 13.2199 1.42735L76.5621 37.998Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <Image src={thumbnail} alt="Video thumbnail" layout="fill" objectFit="cover" />
    </div>
    {title && <span>{title}</span>}
  </div>
)

export const ChipLink = ({
  href,
  uiOnly,
  className,
  target,
  children,
}: {
  href?: string
  className?: string
  uiOnly?: boolean
  target?: '_blank' | '_self' | '_parent' | '_top' | 'framename'
  children: any
}) =>
  uiOnly ? (
    <span
      className={cn(
        'flex flex-auto justify-center sm:justify-between w-full text-center sm:text-left min-h-[43px] sm:w-auto items-center border border-[#232323] bg-gradient-to-r text-white from-[#46444460] to-[#19191980] hover:from-[#4e4e4e90] hover:to-[#19191990] hover:border-stronger backdrop-blur-xl rounded-full text-sm py-2 px-3 sm:pr-2',
        className
      )}
    >
      {children}
    </span>
  ) : !!href ? (
    <Link
      href={href}
      target={target ?? '_self'}
      rel="noopener"
      className={cn(
        'flex flex-auto justify-center sm:justify-between w-full text-center sm:text-left min-h-[43px] sm:w-auto items-center border border-[#232323] bg-gradient-to-r text-white from-[#46444460] to-[#19191980] hover:from-[#4e4e4e90] hover:to-[#19191990] hover:border-stronger backdrop-blur-xl rounded-full text-sm py-2 px-3 sm:pr-2',
        className
      )}
    >
      {children}
    </Link>
  ) : null

export const CartTitle = ({ children, className }: { children: any; className?: string }) => (
  <span className={cn('z-0 relative text-[#F4FFFA90] tracking-[-.5px] text-xl', className)}>
    {children}
  </span>
)

export default {
  DayLink,
  CartTitle,
  ChipLink,
  SmallCard,
  StyledArticleBadge,
}
