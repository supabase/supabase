import Image from 'next/image'
import { cn } from 'ui'

import type { IdentityProviderDisplay } from '@/lib/external-identity-providers'

/**
 * Renders a monochrome identity-provider mark as a CSS mask so it inherits the current theme's
 * foreground color. The provider SVGs use `currentColor`, which a plain `<img>`/`next/image` would
 * not respect (it would render the icon's literal fill and need a `dark:invert` hack). Masking tints
 * any provider mark correctly in every theme, regardless of how its SVG is colored.
 *
 * Size via `size` (pixels) or `className` (e.g. `size-7`, `size-[30px]`).
 */
export const ProviderIcon = ({
  src,
  alt,
  size,
  className,
}: {
  src: string
  alt: string
  size?: number
  className?: string
}) => (
  <span
    role="img"
    aria-label={alt}
    className={cn('inline-block shrink-0 bg-foreground', className)}
    style={{
      ...(size !== undefined ? { width: size, height: size } : undefined),
      maskImage: `url(${src})`,
      maskRepeat: 'no-repeat',
      maskPosition: 'center',
      maskSize: 'contain',
      WebkitMaskImage: `url(${src})`,
      WebkitMaskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
      WebkitMaskSize: 'contain',
    }}
  />
)

/**
 * Renders the icon for a provider's display metadata (see `getProviderDisplay`): monochrome marks
 * are tinted to the theme via {@link ProviderIcon}, colored icons render as-is.
 */
export const IdentityProviderIcon = ({
  display,
  size = 20,
}: {
  display: IdentityProviderDisplay
  size?: number
}) =>
  display.hasMonochromeIcon ? (
    <ProviderIcon src={display.iconPath} alt={`${display.displayName} icon`} size={size} />
  ) : (
    <Image src={display.iconPath} width={size} height={size} alt={`${display.displayName} icon`} />
  )
