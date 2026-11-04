// legacy layout for docs-layout-v2 off. delete it with the flag
import Link from 'next/link'
import { cn } from 'ui'
import { FooterBottomRow } from '~/components/Navigation/Footer'
import { primaryLinks } from '~/data/footer'
import { LayoutMainContent } from '~/layouts/DefaultLayout'

export const LegacyFooter = ({ className }: { className?: string }) => (
  <LayoutMainContent className={cn('pt-0', className)}>
    <footer role="contentinfo" aria-label="footer">
      <div className="mt-16">
        <ul className="flex flex-col gap-2">
          {primaryLinks.map(({ url, featherIcon: Icon, text, ctaLabel }) => (
            <li key={url} className="flex items-center gap-1 text-xs text-foreground-lighter">
              {Icon && <Icon aria-hidden="true" size={16} strokeWidth={1} />}
              <p>{text}</p>
              <Link
                href={url}
                className="text-primary hover:underline"
                target="_blank"
                rel="noreferrer noopener"
              >
                {ctaLabel}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <hr className="border-default my-6"></hr>
      <FooterBottomRow />
    </footer>
  </LayoutMainContent>
)
