'use client'

import { Button } from 'ui'

import type { GoHeroSection } from '../schemas'
import MediaBlock from './MediaBlock'

export default function HeroSection({
  section,
  compact,
}: {
  section: GoHeroSection
  compact?: boolean
}) {
  const hasMedia = !!(section.image || section.video || section.youtubeUrl)

  return (
    <header
      className={
        compact
          ? 'flex flex-col items-center justify-center border-b border-muted min-h-[50vh]'
          : 'flex flex-col border-b border-muted'
      }
      style={{
        background: 'radial-gradient(circle at 50% 280%, hsl(var(--brand-300)), transparent 70%)',
      }}
    >
      <div
        className={
          hasMedia
            ? 'max-w-[80rem] mx-auto grid grid-cols-1 py-16 md:grid-cols-2 gap-24 items-center md:py-32 px-8'
            : 'max-w-[80rem] mx-auto flex flex-col items-center py-16 gap-4 sm:gap-8 text-center text-balance py-24 px-8'
        }
      >
        <div className={hasMedia ? 'flex flex-col gap-4 sm:gap-6' : 'contents'}>
          {section.subtitle && (
            <p className="text-sm text-brand-link uppercase font-mono tracking-wider">
              {section.subtitle}
            </p>
          )}
          <h1 className="text-3xl md:text-4xl leading-tight tracking-tight text-balance">
            {section.title}
          </h1>
          {section.description && (
            <p
              className={
                hasMedia
                  ? 'text-lg leading-relaxed text-foreground-light text-pretty'
                  : 'text-lg md:text-xl leading-relaxed text-foreground-light md:text-foreground max-w-2xl text-pretty'
              }
            >
              {section.description}
            </p>
          )}
          {section.ctas && section.ctas.length > 0 && (
            <div className="flex items-center gap-4 pt-2">
              {section.ctas.map((cta) => (
                <Button
                  key={cta.href}
                  asChild
                  type={cta.variant === 'secondary' ? 'default' : 'primary'}
                  size="medium"
                >
                  <a href={cta.href}>{cta.label}</a>
                </Button>
              ))}
            </div>
          )}
        </div>

        <MediaBlock
          image={section.image}
          video={section.video}
          youtubeUrl={section.youtubeUrl}
          className="p-1 bg-surface-300/30 rounded-2xl"
        />
      </div>
    </header>
  )
}
