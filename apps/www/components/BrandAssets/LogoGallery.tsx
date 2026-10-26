import { CircleCheckFilled, CrossfadeIcon } from '~/components/CrossfadeIcon'
import { BRAND_ASSETS, type BrandAsset } from '~/data/brand-assets'
import { Code, Copy, Download } from 'lucide-react'
import { motion, MotionConfig } from 'motion/react'
import Image from 'next/image'
import { useState, type ReactNode } from 'react'
import { cn, copyToClipboard, Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from 'ui'
import { CodeBlockControls } from 'ui-patterns/CodeBlock/CodeBlockControls'
import {
  CodeBlockFrame,
  CodeBlockTokens,
  type CodeToken,
} from 'ui-patterns/CodeBlock/CodeBlockFrame'
import { getNotchStyle } from 'ui-patterns/Notch'
import { NotchOutline } from 'ui-patterns/Notch/NotchOutline'

type Canvas = 'light' | 'dark'

export interface LogoGalleryProps {
  className?: string
}

interface AssetSectionProps {
  id?: string
  title: string
  description: ReactNode
  children: ReactNode
}

interface BrandColor {
  name: string
  token: string
  value: string
  hex: string
  rgb: string
  hsl: string
  oklch: string
}

interface PaneDownload {
  href: string
  label: string
}

interface PaneSnippet {
  src: string
  alt: string
  width: number
  height: number
}

interface PaneProps {
  caption: string
  snippet: PaneSnippet
  assetName: string
  getCopyText: () => string | Promise<string>
  downloads: PaneDownload[]
  children: ReactNode
  className?: string
}

const NOTCH_WIDTH = 80

const ROW_HIGHLIGHT_TRANSITION = { type: 'tween', duration: 0.15, ease: [0.4, 0, 0.2, 1] } as const

const MORPH_TRANSITION = { type: 'spring', duration: 0.4, bounce: 0 } as const

const SNIPPET_HEIGHT = 24

// the snippets are known shapes, so they carry their docs token classes instead of loading shiki
const SNIPPET_FORMATS: {
  value: string
  label: string
  language: string
  toLines: (snippet: PaneSnippet) => CodeToken[][]
}[] = [
  {
    value: 'html',
    label: 'HTML',
    language: 'html',
    toLines: ({ src, alt, width, height }) => [
      [
        ['<', 's-p'],
        ['img', 's-k'],
      ],
      ...Object.entries({ src, alt, width, height }).map(([name, value]): CodeToken[] => [
        ['  ', undefined],
        [name, 's-r'],
        ['=', 's-p'],
        [`"${value}"`, 's-s'],
      ]),
      [['/>', 's-p']],
    ],
  },
  {
    value: 'markdown',
    label: 'Markdown',
    language: 'markdown',
    toLines: ({ src, alt }) => [
      [
        ['![', 's-p'],
        [alt, 's-s'],
        ['](', 's-p'],
        [src, 's-u'],
        [')', 's-p'],
      ],
    ],
  },
]

const GROUPS: {
  id: BrandAsset['group']
  title: string
  description: string
  imageClassName: string
}[] = [
  {
    id: 'icon',
    title: 'Icon',
    description:
      'The green symbol without lettering. Use it in small spaces, such as avatars, app icons, or a row of partner logos.',
    imageClassName: 'h-24 w-auto',
  },
  {
    id: 'logo',
    title: 'Wordmark',
    description:
      'The symbol and the Supabase lettering together. Use it by default when there is space for the name.',
    imageClassName: 'h-12 w-auto',
  },
  {
    id: 'one-color',
    title: 'One-color wordmark',
    description:
      'The wordmark in black or white. Use it when you can print only one color, or on top of a photo.',
    imageClassName: 'h-12 w-auto',
  },
]

const CANVAS_CAPTIONS: Record<Canvas, string> = {
  light: 'Light',
  dark: 'Dark',
}

// values come from the design system tokens in packages/ui/build/css
const COLORS: BrandColor[] = [
  {
    name: 'Supabase green',
    token: 'brand-default',
    value: 'hsl(var(--brand-default))',
    hex: '#3ECF8E',
    rgb: 'rgb(62 207 142)',
    hsl: 'hsl(153.1 60.2% 52.7%)',
    oklch: 'oklch(76.2% 0.154 159.4)',
  },
  {
    name: 'Dark gray',
    token: 'gray-dark-200',
    value: 'hsl(var(--colors-gray-dark-200))',
    hex: '#1C1C1C',
    rgb: 'rgb(28 28 28)',
    hsl: 'hsl(0 0% 11%)',
    oklch: 'oklch(22.6% 0 0)',
  },
  {
    name: 'Light gray',
    token: 'gray-light-200',
    value: 'hsl(var(--colors-gray-light-200))',
    hex: '#F8F8F8',
    rgb: 'rgb(248 248 248)',
    hsl: 'hsl(0 0% 97.3%)',
    oklch: 'oklch(97.9% 0 0)',
  },
]

const CONNECT_BUTTON_URL =
  'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/supabase-brand-assets/connect-supabase'

const CONNECT_BUTTONS: { canvas: Canvas; svg: string; alt: string }[] = [
  {
    canvas: 'light',
    svg: `${CONNECT_BUTTON_URL}/connect-supabase-dark.svg`,
    alt: 'Dark Connect Supabase button',
  },
  {
    canvas: 'dark',
    svg: `${CONNECT_BUTTON_URL}/connect-supabase-light.svg`,
    alt: 'Light Connect Supabase button',
  },
]

// a failed fetch rejects, so copyToClipboard shows its error toast instead of copying the error page
const fetchText = (url: string) =>
  fetch(url).then((response) => {
    if (!response.ok) throw new Error(`${response.status} ${url}`)
    return response.text()
  })

export const LogoGallery = ({ className }: LogoGalleryProps) => (
  <div className={cn('section-container flex flex-col gap-20 py-16 md:py-24', className)}>
    {GROUPS.map((group) => {
      const assets = BRAND_ASSETS.filter((asset) => asset.group === group.id)
      const panes = assets.flatMap((asset) =>
        asset.canvas === 'any'
          ? (['light', 'dark'] satisfies Canvas[]).map((canvas) => ({ canvas, asset }))
          : [{ canvas: asset.canvas, asset }]
      )

      return (
        <AssetSection
          key={group.id}
          id={group.id}
          title={group.title}
          description={group.description}
        >
          {panes.map(({ canvas, asset }) => (
            <Pane
              key={`${asset.id}:${canvas}`}
              caption={CANVAS_CAPTIONS[canvas]}
              snippet={{
                src: `https://supabase.com${asset.svg}`,
                alt: 'Supabase',
                width: Math.round((SNIPPET_HEIGHT * asset.pngWidth) / asset.pngHeight),
                height: SNIPPET_HEIGHT,
              }}
              assetName={asset.name}
              getCopyText={() => fetchText(asset.svg)}
              downloads={[
                { href: asset.svg, label: '.svg' },
                { href: asset.png, label: '.png' },
              ]}
              className={cn(
                'items-center justify-center p-10',
                canvas === 'dark' ? 'bg-pane-dark' : 'bg-white'
              )}
            >
              <Image
                src={asset.svg}
                alt={
                  canvas === 'dark' && asset.canvas === 'any'
                    ? ''
                    : `Supabase ${asset.name.toLowerCase()}`
                }
                width={asset.pngWidth}
                height={asset.pngHeight}
                className={cn('max-w-full', group.imageClassName)}
              />
            </Pane>
          ))}
        </AssetSection>
      )
    })}
    <AssetSection
      title="Colors"
      description="The values come from the Supabase design system tokens. Use Supabase green for brand elements. Use the grays for backgrounds and lettering. Each value is valid CSS."
    >
      <ColorPalette colors={COLORS} />
    </AssetSection>
    <AssetSection
      title="Integrations"
      description={
        <>
          Use the Connect Supabase button to start the OAuth 2.0 flow in your{' '}
          <a
            href="/docs/guides/platform/oauth-apps/build-a-supabase-integration"
            className="text-foreground underline"
          >
            Supabase integration
          </a>
          . Do not use the button as a logo.
        </>
      }
    >
      {CONNECT_BUTTONS.map((button) => (
        <Pane
          key={button.canvas}
          caption={CANVAS_CAPTIONS[button.canvas]}
          snippet={{ src: button.svg, alt: 'Connect Supabase', width: 156, height: 31 }}
          assetName={button.alt}
          getCopyText={() => fetchText(button.svg)}
          downloads={[
            { href: button.svg, label: '.svg' },
            { href: `${CONNECT_BUTTON_URL}/connect-supabase.zip`, label: '.zip' },
          ]}
          className={cn(
            'items-center justify-center p-10',
            button.canvas === 'dark' ? 'bg-pane-dark' : 'bg-white'
          )}
        >
          <Image src={button.svg} alt={button.alt} width={156} height={31} />
        </Pane>
      ))}
    </AssetSection>
  </div>
)

const AssetSection = ({ id, title, description, children }: AssetSectionProps) => (
  <section id={id} className="flex scroll-mt-24 flex-col gap-6">
    <header className="flex max-w-2xl flex-col gap-2">
      <h2 className="m-0 text-3xl tracking-tight text-foreground">{title}</h2>
      <p className="m-0 text-balance text-base text-foreground-light">{description}</p>
    </header>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{children}</div>
  </section>
)

const Pane = ({
  caption,
  snippet,
  assetName,
  getCopyText,
  downloads,
  children,
  className,
}: PaneProps) => {
  const [isCopied, setIsCopied] = useState(false)
  const [isCodeOpen, setIsCodeOpen] = useState(false)

  const handleCodeClick = () => setIsCodeOpen((isOpen) => !isOpen)

  // the ClipboardItem promise keeps a fetched copy inside the user gesture in safari.
  // the canvas copies on click, and the copy button below is the keyboard path to the same action
  const handleCopy = () => {
    copyToClipboard(Promise.resolve(getCopyText()), () => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    })
  }

  return (
    <div className="group/pane flex flex-col gap-2 rounded-xl border border-default p-2">
      <div style={getNotchStyle(NOTCH_WIDTH)} className="relative h-80">
        <MotionConfig reducedMotion="user">
          <div className="notch-corner absolute inset-0 rounded-lg border border-default bg-surface-75">
            <motion.div
              layout
              initial={false}
              animate={{ borderRadius: isCodeOpen ? 6 : 11 }}
              transition={{ ...MORPH_TRANSITION, delay: isCodeOpen ? 0 : 0.12 }}
              className={cn(
                'absolute flex',
                className,
                isCodeOpen ? 'left-3 top-3 h-8 p-1.5' : 'inset-0'
              )}
            >
              {isCodeOpen ? null : (
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  onClick={handleCopy}
                  data-copy-canvas
                  className="absolute inset-0 cursor-pointer"
                />
              )}
              <motion.div
                layout
                transition={{ ...MORPH_TRANSITION, delay: isCodeOpen ? 0 : 0.12 }}
                className={cn('flex', isCodeOpen && 'h-full [&_img]:h-full [&_img]:w-auto')}
              >
                {children}
              </motion.div>
            </motion.div>
            <Tabs
              defaultValue="html"
              inert={!isCodeOpen}
              className={cn(
                'absolute inset-x-0 top-3 flex flex-col gap-3',
                'transition duration-200 ease-out motion-reduce:transition-opacity',
                isCodeOpen ? 'opacity-100 delay-200' : 'translate-y-1 opacity-0'
              )}
            >
              <TabsList className="mr-3 h-8 self-end border-b-0 has-[[data-tab-indicator]]:after:hidden">
                {SNIPPET_FORMATS.map((format) => (
                  <TabsTrigger
                    key={format.value}
                    value={format.value}
                    className="relative z-1 h-8 rounded-md text-xs data-[state=active]:shadow-none"
                  >
                    <span className="px-3">{format.label}</span>
                  </TabsTrigger>
                ))}
                <TabsIndicator className="top-0 h-full rounded-md bg-surface-300" />
              </TabsList>
              {SNIPPET_FORMATS.map((format) => {
                const lines = format.toLines(snippet)
                const code = lines.map((line) => line.map(([text]) => text).join('')).join('\n')
                return (
                  <TabsContent key={format.value} value={format.value} className="mt-0">
                    <CodeBlockFrame
                      compact
                      lang={format.language}
                      lineCount={lines.length}
                      controls={<CodeBlockControls content={code} defaultWrapped />}
                    >
                      <CodeBlockTokens lineNumbers lines={lines} />
                    </CodeBlockFrame>
                  </TabsContent>
                )
              })}
            </Tabs>
          </div>
        </MotionConfig>
        <NotchOutline width={NOTCH_WIDTH} surfaceClassName="stroke-(--background-surface-75)" />
        <button
          type="button"
          tabIndex={0}
          onClick={handleCodeClick}
          className={cn(
            'absolute bottom-0 right-0 flex h-8 w-(--notch-width) items-center justify-center gap-1.5 rounded-md',
            'font-mono text-xs text-foreground-light transition-colors hover:text-foreground focus-ring'
          )}
        >
          {isCodeOpen ? (
            <>
              <span className="sr-only">Show preview for {assetName}: </span>
              Preview
            </>
          ) : (
            <>
              <Code aria-hidden className="size-3.5" />
              <span className="sr-only">Show code for {assetName}: </span>
              Code
            </>
          )}
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 pl-2 pt-1">
        <span className="text-sm text-foreground-lighter">{caption}</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            tabIndex={0}
            onClick={handleCopy}
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-default bg-surface-100 py-1 pr-2 pl-1.5',
              'font-mono text-xs text-foreground-light',
              'transition-colors hover:bg-surface-200 hover:text-foreground focus-ring',
              'group-has-[[data-copy-canvas]:hover]/pane:bg-surface-200 group-has-[[data-copy-canvas]:hover]/pane:text-foreground'
            )}
          >
            <CrossfadeIcon
              isActive={isCopied}
              activeIcon={<CircleCheckFilled className="size-3" />}
              inactiveIcon={<Copy className="size-3" />}
              className="size-3"
            />
            <span className="sr-only">
              {isCopied ? 'Copied ' : 'Copy '}
              {assetName} as{' '}
            </span>
            SVG
          </button>
          {downloads.map((download) => (
            <a
              key={download.href}
              href={download.href}
              download
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border border-default bg-surface-100 py-1 pr-2 pl-1.5',
                'font-mono text-xs text-foreground-light',
                'transition-colors hover:bg-surface-200 hover:text-foreground focus-ring'
              )}
            >
              <Download aria-hidden className="size-3" />
              <span className="sr-only">Download {assetName} as </span>
              {download.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

const ColorPalette = ({ colors }: { colors: BrandColor[] }) => {
  const [copied, setCopied] = useState<string | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  // react batches the leave and the next enter, so the highlight still slides between rows
  const handleRowLeave = () => setHoveredRow(null)

  const handleCopy = (key: string, value: string) => {
    copyToClipboard(value, () => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid grid-cols-1 gap-6 md:col-span-2 md:grid-cols-3">
        {colors.map((color) => (
          <article
            key={color.token}
            className="flex flex-col gap-2 rounded-xl border border-default p-2"
          >
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              onClick={() => handleCopy(`${color.token}:HEX`, color.hex)}
              className="flex cursor-pointer flex-col items-stretch"
            >
              <span
                style={{ backgroundColor: color.value }}
                className="control-surface-shadows raised-control-surface block h-12 w-full rounded-lg"
              />
            </button>
            <div className="flex flex-col gap-0.5 p-3">
              <h3 className="m-0 text-base text-foreground">{color.name}</h3>
              <p className="m-0 font-mono text-xs text-foreground-lighter">{color.token}</p>
            </div>
            <dl
              className={cn(
                'relative isolate m-0 flex flex-col overflow-hidden rounded-lg border border-default',
                '[&>div:hover]:before:opacity-0 [&>div:has(+div:hover)]:before:opacity-0'
              )}
            >
              {hoveredRow?.startsWith(`${color.token}:`) ? null : (
                <motion.span
                  layoutId={`${color.token}:row-highlight`}
                  transition={ROW_HIGHLIGHT_TRANSITION}
                  className="absolute inset-0 -z-10 bg-surface-200"
                />
              )}
              {[
                { label: 'HEX', value: color.hex },
                { label: 'RGB', value: color.rgb },
                { label: 'HSL', value: color.hsl },
                { label: 'OKLCH', value: color.oklch },
              ].map((format) => {
                const key = `${color.token}:${format.label}`
                const isCopied = copied === key

                return (
                  <div
                    key={format.label}
                    onPointerEnter={() => setHoveredRow(key)}
                    onPointerLeave={handleRowLeave}
                    className={cn(
                      'group/row relative isolate flex items-center gap-3 px-3 py-1.5',
                      'before:absolute before:inset-x-3 before:bottom-0 before:h-px before:transition-opacity',
                      'not-last:before:bg-border'
                    )}
                  >
                    {hoveredRow === key ? (
                      <motion.span
                        layoutId={`${color.token}:row-highlight`}
                        transition={ROW_HIGHLIGHT_TRANSITION}
                        className="absolute inset-0 -z-10 bg-surface-200"
                      />
                    ) : null}
                    <dt className="w-12 font-mono text-xs text-foreground-lighter transition-colors group-hover/row:text-foreground-light">
                      {format.label}
                    </dt>
                    <dd className="m-0 flex-1 truncate font-mono text-xs text-foreground-light transition-colors group-hover/row:text-foreground">
                      {format.value}
                    </dd>
                    <button
                      type="button"
                      tabIndex={0}
                      onClick={() => handleCopy(key, format.value)}
                      className={cn(
                        'flex size-7 items-center justify-center rounded-md text-foreground-lighter transition-colors focus-ring',
                        'group-hover/row:text-foreground',
                        'after:absolute after:inset-0 after:cursor-pointer'
                      )}
                    >
                      <CrossfadeIcon
                        isActive={isCopied}
                        activeIcon={<CircleCheckFilled className="size-3.5" />}
                        inactiveIcon={<Copy className="size-3" />}
                        className={cn(
                          'size-3.5 transition-opacity',
                          !isCopied && 'opacity-0 group-has-[:focus-visible]/row:opacity-100'
                        )}
                      />
                      <span className="sr-only">
                        {isCopied ? 'Copied' : 'Copy'} {color.name} {format.label}
                      </span>
                    </button>
                  </div>
                )
              })}
            </dl>
          </article>
        ))}
      </div>
    </MotionConfig>
  )
}
