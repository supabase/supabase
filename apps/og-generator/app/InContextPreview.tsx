'use client'

/**
 * "View in situ" mockups (Supaimage in-context preview follow-up).
 *
 * Today's platform-crop preview only shows a cropped rectangle — not what the
 * image looks like in actual use. These are rough, illustrative approximations
 * of real post/listing UI (not pixel-matches to the live platforms/site),
 * embedding the currently-rendered image so switching Brand/Format instantly
 * shows how it reads in context. Twitter/X and LinkedIn use each platform's
 * real light/dark palette (not our app's semantic tokens) so the colors read
 * as authentic, not just "dark card on our UI".
 */

export type InContextMode = 'none' | 'twitter' | 'linkedin' | 'blog-post' | 'blog'
type PreviewTheme = 'light' | 'dark'

export const IN_CONTEXT_OPTS: { value: InContextMode; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'twitter', label: 'X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'blog-post', label: 'Blog post' },
  { value: 'blog', label: 'Blog listing' },
]

interface Props {
  imgUrl: string | null
  /**
   * The Thumb render, when the active format has one — the real blog post
   * page's hero crops whichever image it's given to a fixed 1.91:1 box, so
   * passing this through the Blog-post mockup shows the actual crop instead
   * of assuming the OG image's own aspect ratio survives untouched.
   */
  thumbImgUrl?: string | null
  headline: string
  eyebrow: string | null
  aspect: string
}

interface ThemedProps extends Props {
  theme: PreviewTheme
}

// Real platform palettes (brief follow-up: "as accurate as possible") —
// deliberately hardcoded hex, not our app's semantic tokens, since the goal
// is to look like the actual X/LinkedIn UI, not our own design system.
const TWITTER_PALETTE = {
  light: { bg: '#ffffff', text: '#0f1419', secondary: '#536471', border: '#eff3f4', icon: '#536471' },
  dark: { bg: '#000000', text: '#e7e9ea', secondary: '#71767b', border: '#2f3336', icon: '#71767b' },
}
const TWITTER_BLUE = '#1d9bf0'

const LINKEDIN_PALETTE = {
  light: { bg: '#ffffff', text: 'rgba(0,0,0,0.9)', secondary: 'rgba(0,0,0,0.6)', border: '#e0e0e0', avatar: '#e0e0e0' },
}
const LINKEDIN_BLUE = '#0a66c2'

function ActionIcon({ d, color }: { d: string; color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const ICONS = {
  reply: 'M21 12a8 8 0 1 1-3.2-6.4M21 5v5h-5',
  retweet: 'M17 2l4 4-4 4M3 6h13a4 4 0 0 1 4 4v2M7 22l-4-4 4-4M21 18H8a4 4 0 0 1-4-4v-2',
  like: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z',
  share: 'M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14',
}

function VerifiedBadge({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l2.4 1.2 2.6-.6 1.4 2.3 2.3 1.4-.6 2.6L21.3 11l-1.2 2.4.6 2.6-2.3 1.4-1.4 2.3-2.6-.6L12 20.3l-2.4-1.2-2.6.6-1.4-2.3-2.3-1.4.6-2.6L2.7 11l1.2-2.4-.6-2.6 2.3-1.4 1.4-2.3 2.6.6z" />
      <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TwitterCardMockup({ imgUrl, headline, aspect, theme }: ThemedProps) {
  const c = TWITTER_PALETTE[theme]
  return (
    <div
      className="w-full max-w-[500px] rounded-2xl border p-4"
      style={{ backgroundColor: c.bg, borderColor: c.border, color: c.text, fontFamily: 'Helvetica, Arial, sans-serif' }}
    >
      <div className="flex gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full" style={{ backgroundColor: c.border }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[15px]">
            <span className="font-bold">Supabase</span>
            <VerifiedBadge color={TWITTER_BLUE} />
            <span style={{ color: c.secondary }}>@supabase · 2h</span>
          </div>
          <p className="mt-0.5 text-[15px] leading-snug">{headline}</p>
          {imgUrl && (
            <div className="mt-3 w-full overflow-hidden rounded-2xl border" style={{ aspectRatio: aspect, borderColor: c.border }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgUrl} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="mt-3 flex max-w-[320px] items-center justify-between">
            <ActionIcon d={ICONS.reply} color={c.icon} />
            <ActionIcon d={ICONS.retweet} color={c.icon} />
            <ActionIcon d={ICONS.like} color={c.icon} />
            <ActionIcon d={ICONS.share} color={c.icon} />
          </div>
        </div>
      </div>
    </div>
  )
}

function LinkedInCardMockup({ imgUrl, headline, aspect }: Props) {
  const c = LINKEDIN_PALETTE.light
  return (
    <div
      className="w-full max-w-[500px] rounded-lg border p-4"
      style={{
        backgroundColor: c.bg,
        borderColor: c.border,
        color: c.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div className="flex gap-2">
        <div className="h-12 w-12 shrink-0 rounded-full" style={{ backgroundColor: c.avatar }} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Supabase</div>
          <div className="text-xs" style={{ color: c.secondary }}>
            148,203 followers
          </div>
          <div className="text-xs" style={{ color: c.secondary }}>
            2h · 🌐
          </div>
        </div>
        <button
          className="h-fit shrink-0 rounded-full border px-3 py-1 text-sm font-semibold"
          style={{ borderColor: LINKEDIN_BLUE, color: LINKEDIN_BLUE }}
        >
          + Follow
        </button>
      </div>
      <p className="mt-3 text-sm leading-snug">{headline}</p>
      {imgUrl && (
        <div className="mt-3 -mx-4 w-[calc(100%+2rem)] overflow-hidden border-y" style={{ aspectRatio: aspect, borderColor: c.border }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: c.secondary }}>
        <ActionIcon d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14" color={c.secondary} />
        Like
        <span className="ml-3">Comment</span>
        <span className="ml-3">Share</span>
      </div>
    </div>
  )
}

// Real supabase.com/blog/[slug] hero crops whatever image it's given into a
// fixed 1.91:1 box via object-cover — independent of the source image's own
// aspect ratio (apps/www/components/Blog/BlogPostRenderer.tsx line ~193).
const BLOG_POST_HERO_ASPECT = '1.91 / 1'

// Primary nav labels, verbatim (apps/www/data/nav.tsx).
const NAV_ITEMS = ['Product', 'Developers', 'Solutions', 'Pricing', 'Docs']

// Shared by both Blog mockups — same real nav (apps/www/components/Nav/index.tsx).
function SiteNav() {
  return (
    <div className="flex h-16 items-center justify-between gap-4 border-b border-default px-6">
      <div className="flex items-center gap-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand-logos/supabase-wordmark.svg" alt="Supabase" className="h-5 w-auto" />
        <div className="hidden items-center gap-6 text-sm text-foreground sm:flex">
          {NAV_ITEMS.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="hidden text-foreground sm:inline">Sign in</span>
        <span className="rounded-full bg-foreground px-4 py-1.5 font-medium text-background">
          Start your project
        </span>
      </div>
    </div>
  )
}

function BlogPostMockup({ imgUrl, thumbImgUrl, headline, eyebrow }: Props) {
  const heroSrc = thumbImgUrl ?? imgUrl
  return (
    // `data-theme="dark"` scopes the real dark-theme CSS variables to this
    // subtree (blog pages force dark mode via useForceDeepDark) — so
    // bg-background/border-default/text-foreground etc. below resolve to
    // supabase.com's actual palette, not an approximation of it.
    <div
      data-theme="dark"
      className="w-full overflow-hidden rounded-lg border border-default bg-background text-foreground"
    >
      <SiteNav />

      <div className="grid grid-cols-12 gap-4 px-6 py-10 sm:px-10">
        <div className="col-span-2 hidden xl:block">
          <div className="flex items-center gap-1 text-sm text-foreground-lighter">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </div>
        </div>

        <div className="col-span-12 xl:col-span-10">
          <div className="mb-8 flex max-w-3xl flex-col gap-4">
            <span className="hidden text-sm text-brand lg:inline-flex">Blog</span>
            <h1 className="text-4xl">{headline}</h1>
            <div className="flex items-center gap-3 text-sm text-foreground-lighter">
              <span>Jul 10, 2026</span>
              <span>·</span>
              <span>4 minute read</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-full border border-default bg-surface-300" />
              <div className="flex flex-col leading-tight">
                <span className="text-sm text-foreground">Supabase Team</span>
                <span className="text-xs text-foreground-lighter">Marketing</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-7">
              {heroSrc && (
                <div
                  className="w-full overflow-hidden rounded-lg border border-default"
                  style={{ aspectRatio: BLOG_POST_HERO_ASPECT }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={heroSrc} alt="" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
            <div className="col-span-12 hidden flex-col gap-4 lg:col-span-5 lg:flex xl:col-span-3 xl:col-start-9">
              {eyebrow && (
                <span className="w-fit rounded-full border border-default px-2.5 py-0.5 text-xs text-foreground-lighter">
                  {eyebrow}
                </span>
              )}
              <div className="text-sm text-foreground">Share this article</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Category pills shown on the real /blog filter bar (BlogFilters.tsx), verbatim.
const BLOG_CATEGORIES = ['All', 'Product', 'Company', 'Postgres', 'Developers', 'Engineering', 'Launch Week']

// Grid cards use a 1.91:1 image (BlogGridItem.tsx); the featured post above
// the grid uses a wider ~3:2 hero (FeaturedThumb.tsx) — genuinely different
// crops, so both need their own aspect box like the real page.
const GRID_CARD_ASPECT = '1.91 / 1'
const FEATURED_ASPECT = '3 / 2'

function BlogGridCard({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl p-2">
      <div
        className="w-full overflow-hidden rounded-lg border border-default bg-surface-100"
        style={{ aspectRatio: GRID_CARD_ASPECT }}
      >
        <div className="h-full w-full bg-surface-200" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-sm text-foreground-lighter">
          <span>10 Jul 2026</span>
          <span>·</span>
          <span>{eyebrow}</span>
        </span>
        <span className="max-w-sm text-xl text-foreground">{title}</span>
      </div>
    </div>
  )
}

function BlogListingMockup({ imgUrl, headline, eyebrow }: Props) {
  return (
    // Same forced-dark scoping as the Blog-post mockup — /blog uses the same
    // Nav + dark theme as individual posts.
    <div
      data-theme="dark"
      className="w-full overflow-hidden rounded-lg border border-default bg-background text-foreground"
    >
      <SiteNav />

      <div className="px-6 py-10 sm:px-10">
        <h1 className="mb-6 text-4xl">Blog</h1>

        {/* Filter bar (apps/www/components/Blog/BlogFilters.tsx) — static, not
            functional in this mockup. */}
        <div className="mb-10 flex items-center justify-between gap-4 border-b border-default pb-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {BLOG_CATEGORIES.map((cat) => (
              <span key={cat} className={cat === 'All' ? 'text-foreground' : 'text-foreground-lighter'}>
                {cat}
              </span>
            ))}
          </div>
          <span className="hidden shrink-0 rounded-md border border-default px-3 py-1.5 text-xs text-foreground-lighter sm:block">
            Search blog
          </span>
        </div>

        {/* Featured post — the currently-edited headline/image, exactly like
            the real page's FeaturedThumb sitting above (not inside) the grid. */}
        <div className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-7 lg:gap-8">
          <div className="lg:col-span-3">
            <div
              className="w-full overflow-hidden rounded-lg border border-default"
              style={{ aspectRatio: FEATURED_ASPECT }}
            >
              {imgUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
          </div>
          <div className="flex flex-col justify-center gap-3 lg:col-span-4">
            {eyebrow && (
              <span className="text-xs font-medium uppercase tracking-wide text-foreground-lighter">
                {eyebrow}
              </span>
            )}
            <h2 className="text-3xl text-foreground">{headline}</h2>
            <div className="flex items-center gap-3 pt-2">
              <div className="h-8 w-8 shrink-0 rounded-full border border-default bg-surface-300" />
              <span className="text-sm text-foreground">Supabase Team</span>
            </div>
          </div>
        </div>

        {/* Uniform 3-col grid (BlogClient.tsx) — featured post is excluded
            from this loop on the real page too. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <BlogGridCard eyebrow="Engineering" title="Scaling Postgres connections with Supavisor" />
          <BlogGridCard eyebrow="Launch Week" title="Introducing Edge Functions v2" />
          <BlogGridCard eyebrow="Postgres" title="What's new in pg_graphql" />
        </div>
      </div>
    </div>
  )
}

export function InContextPreview({ mode, ...rest }: Props & { mode: InContextMode }) {
  if (mode === 'none') return null
  if (mode === 'twitter') {
    // Twitter/X always shows both themes side by side — no toggle needed.
    return (
      <div className="flex w-full flex-wrap justify-center gap-4 rounded-lg bg-surface-100 p-6">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-foreground-lighter">Light</span>
          <TwitterCardMockup {...rest} theme="light" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-foreground-lighter">Dark</span>
          <TwitterCardMockup {...rest} theme="dark" />
        </div>
      </div>
    )
  }
  return (
    <div className="flex w-full justify-center rounded-lg bg-surface-100 p-6">
      {mode === 'linkedin' && <LinkedInCardMockup {...rest} />}
      {mode === 'blog-post' && <BlogPostMockup {...rest} />}
      {mode === 'blog' && <BlogListingMockup {...rest} />}
    </div>
  )
}
