'use client'

import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import { AnimatePresence, motion } from 'framer-motion'
import { Link as LinkIcon } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { cn } from 'ui'

import { ShieldGlow } from './Shaders/ShieldGlow'

const PROVIDERS = [
  'github',
  'google',
  'apple',
  'discord',
  'facebook',
  'gitlab',
  'microsoft',
  'twitter',
  'twitch',
  'spotify',
  'slack',
  'bitbucket',
  'twilio',
  'solana',
  'ethereum',
]

const FEATURES = [
  {
    title: 'All the social providers',
    description:
      'Add social logins with one click. Google, Facebook, GitHub, Azure (Microsoft), GitLab, Twitter, Discord, and many more.',
    visual: ProvidersSkeleton,
  },
  {
    title: 'Fully integrated',
    description:
      'Auth without any external services. Built-in authentication, authorization, and user management.',
    visual: IntegratedSkeleton,
  },
  {
    title: 'Own your data',
    description:
      'User data stored in your Supabase database. No third-party privacy concerns. Host in 17+ locations.',
    visual: DataOwnershipSkeleton,
  },
]

const COLS = 13
const ROWS = 13
const CELL_SIZE = 48
const GAP = 10

function ProvidersSkeleton() {
  const [activeCell, setActiveCell] = useState(Math.floor((COLS * ROWS) / 2))
  const prevCell = useRef(activeCell)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  const totalCells = COLS * ROWS
  const grid = Array.from({ length: totalCells }, (_, i) => PROVIDERS[i % PROVIDERS.length])

  // Keep highlight away from edges so grid always overflows the card
  const MARGIN = 3
  const pickNext = () => {
    const prev = prevCell.current
    const prevCol = prev % COLS
    const prevRow = Math.floor(prev / COLS)
    let next = prev
    const prevProvider = PROVIDERS[prev % PROVIDERS.length]
    // Try until we get a cell 5+ tiles away and a different provider
    for (let attempt = 0; attempt < 50; attempt++) {
      const col = MARGIN + Math.floor(Math.random() * (COLS - MARGIN * 2))
      const row = MARGIN + Math.floor(Math.random() * (ROWS - MARGIN * 2))
      const candidate = row * COLS + col
      const dist = Math.abs(col - prevCol) + Math.abs(row - prevRow)
      if (dist >= 5 && PROVIDERS[candidate % PROVIDERS.length] !== prevProvider) {
        next = candidate
        break
      }
    }
    prevCell.current = next
    return next
  }

  // Compute offset to center the active cell in the viewport
  const activeCol = activeCell % COLS
  const activeRow = Math.floor(activeCell / COLS)
  const centerCol = Math.floor(COLS / 2)
  const centerRow = Math.floor(ROWS / 2)
  const offsetX = (centerCol - activeCol) * (CELL_SIZE + GAP)
  const offsetY = (centerRow - activeRow) * (CELL_SIZE + GAP)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), {
      threshold: 0.3,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isInView) return
    const timer = setInterval(() => setActiveCell(pickNext()), 5000)
    return () => clearInterval(timer)
  }, [isInView])

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="A grid of social login provider icons — Google, GitHub, Apple, Discord, and more — with one highlighted at a time"
      className="flex items-center justify-center w-full h-full relative overflow-hidden pointer-events-none select-none"
      style={{
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 75%)',
      }}
    >
      <div
        className="grid transition-transform duration-1000 ease-in-out"
        style={{
          gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${ROWS}, ${CELL_SIZE}px)`,
          gap: `${GAP}px`,
          transform: `translate(${offsetX}px, ${offsetY}px)`,
        }}
      >
        {grid.map((provider, i) => {
          const isActive = i === activeCell
          return (
            <div
              key={i}
              className={cn(
                'flex items-center justify-center w-12 h-12 rounded-lg border transition-all duration-1000',
                isActive ? 'bg-surface-200 border-border scale-110' : 'bg-surface-75 border-border'
              )}
            >
              <Image
                src={`/images/product/auth/${provider}-icon.svg`}
                alt={provider}
                width={20}
                height={20}
                className={cn(
                  'transition-all duration-1000',
                  isActive ? 'opacity-100 grayscale-0' : 'opacity-40 grayscale'
                )}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function IntegratedSkeleton() {
  return (
    <div
      role="img"
      aria-label="Preview of Supabase Auth UI components — magic link sign-in, profile, organization setup, email verification, sign-up, password reset, account chooser, session tokens, and two-factor authentication"
      className="relative flex h-full w-full items-center justify-center overflow-hidden pointer-events-none select-none"
      style={{
        maskImage:
          'linear-gradient(to bottom, transparent, black 15%, black 65%, transparent), linear-gradient(to right, transparent, black 20%, black 80%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent, black 15%, black 65%, transparent), linear-gradient(to right, transparent, black 20%, black 80%, transparent)',
        maskComposite: 'intersect',
        WebkitMaskComposite: 'destination-in',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Left column */}
        <div className="flex w-[180px] shrink-0 flex-col gap-3 pt-4">
          {/* Magic link card */}
          <div className="rounded-xl border border-border bg-surface-100 p-4">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[11px] font-medium text-foreground">
                Sign in with magic link
              </span>
              <div className="flex h-6 w-full items-center rounded border border-border bg-surface-200 px-2">
                <span className="text-[10px] text-foreground-muted">cameron@gmail.com</span>
              </div>
              <div className="flex h-6 w-full items-center justify-center rounded bg-foreground">
                <span className="text-[9px] font-medium text-background">Send magic link</span>
              </div>
            </div>
          </div>
          {/* Profile card */}
          <div className="rounded-xl border border-border bg-surface-100 p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[10px] font-medium text-brand">
                  CW
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-foreground">Cameron Walker</span>
                  <span className="text-[10px] text-foreground-muted">cameron@gmail.com</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-foreground-muted">Name</span>
                <div className="flex h-6 items-center rounded border border-border bg-surface-200 px-2">
                  <span className="text-[10px] text-foreground-muted">Cameron Walker</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-foreground-muted">Phone number</span>
                <div className="flex h-6 items-center rounded border border-border bg-surface-200 px-2">
                  <span className="text-[10px] text-foreground-muted">+1 (555) 000-0000</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-foreground-muted">Connected account</span>
                <span className="text-[9px] text-brand">Google</span>
              </div>
            </div>
          </div>
          {/* Organization card */}
          <div className="rounded-xl border border-border bg-surface-100 p-4">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-medium text-foreground">Create organization</span>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-foreground-muted">Name</span>
                <div className="flex h-6 items-center rounded border border-border bg-surface-200 px-2">
                  <span className="text-[10px] text-foreground-muted">Acme Inc</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-foreground-muted">Logo</span>
                <div className="flex h-10 items-center justify-center rounded border border-dashed border-border bg-surface-200">
                  <span className="text-[9px] text-foreground-muted">Upload image</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center column */}
        <div className="flex w-[220px] shrink-0 flex-col gap-3">
          {/* Verify email card */}
          <div className="rounded-xl border border-border bg-surface-100 p-4">
            <div className="flex flex-col items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3ECF8E"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-10 6L2 7" />
                </svg>
              </div>
              <span className="text-[11px] font-medium text-foreground">Verify your email</span>
              <div className="flex gap-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex h-6 w-5 items-center justify-center rounded border border-border bg-surface-200 text-[10px] text-foreground-muted"
                  >
                    {i < 3 ? '•' : ''}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Sign up card */}
          <div className="rounded-xl border border-border bg-surface-100 p-5 shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground">
                <svg width="16" height="17" viewBox="0 0 109 113" fill="none" aria-hidden>
                  <path
                    d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
                    fill="#249361"
                  />
                  <path
                    d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z"
                    fill="#3ECF8E"
                  />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-foreground">Create your account</div>
                <div className="mt-0.5 text-[10px] text-foreground-muted">
                  Welcome! Please fill in the details.
                </div>
              </div>
              <div className="flex w-full flex-col gap-1.5">
                <div className="flex h-7 items-center justify-center gap-1.5 rounded border border-border bg-surface-200">
                  <span className="text-[10px] text-foreground-muted">Continue with Google</span>
                </div>
                <div className="flex h-7 items-center justify-center gap-1.5 rounded border border-border bg-surface-200">
                  <span className="text-[10px] text-foreground-muted">Continue with GitHub</span>
                </div>
              </div>
            </div>
          </div>
          {/* Password reset card */}
          <div className="rounded-xl border border-border bg-surface-100 p-4">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[11px] font-medium text-foreground">Reset your password</span>
              <div className="flex flex-col gap-1 w-full">
                <span className="text-[10px] font-medium text-foreground">New password</span>
                <div className="flex h-6 items-center rounded border border-border bg-surface-200 px-2">
                  <span className="text-[10px] tracking-widest text-foreground-muted">
                    ••••••••
                  </span>
                </div>
              </div>
              <div className="flex h-6 w-full items-center justify-center rounded bg-foreground">
                <span className="text-[9px] font-medium text-background">Update password</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex w-[180px] shrink-0 flex-col gap-3 pt-10">
          {/* Account chooser card */}
          <div className="rounded-xl border border-border bg-surface-100 p-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground">
                  <svg width="12" height="13" viewBox="0 0 109 113" fill="none" aria-hidden>
                    <path
                      d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
                      fill="#249361"
                    />
                    <path
                      d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z"
                      fill="#3ECF8E"
                    />
                  </svg>
                </div>
                <span className="text-[11px] font-medium text-foreground">Choose an account</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {[
                  { name: 'Personal', role: '' },
                  { name: 'Acme Inc', role: 'Admin' },
                  { name: 'My Project', role: 'Member' },
                ].map((account) => (
                  <div
                    key={account.name}
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface-200 px-2.5 py-1.5"
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground-muted/15 text-[8px] text-foreground-muted">
                      {account.name[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-foreground">{account.name}</span>
                      {account.role && (
                        <span className="text-[8px] text-foreground-muted">{account.role}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Session card */}
          <div className="rounded-xl border border-border bg-surface-100 p-4">
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] text-foreground-muted">Session</span>
              {[
                { key: 'access_token', val: 'eyJhbG...kpXVc' },
                { key: 'token_type', val: 'bearer' },
                { key: 'user.email', val: 'cameron@gmail.com' },
                { key: 'user.role', val: 'authenticated' },
              ].map((row) => (
                <div key={row.key} className="flex items-center justify-between">
                  <span className="font-mono text-[9px] text-brand">{row.key}</span>
                  <span className="ml-2 truncate font-mono text-[9px] text-foreground-muted">
                    {row.val}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* MFA card */}
          <div className="rounded-xl border border-border bg-surface-100 p-4">
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-medium text-foreground">Two-factor auth</span>
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface-200 px-2.5 py-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-foreground">Authenticator app</span>
                  <span className="text-[9px] text-foreground-muted">TOTP via auth app</span>
                </div>
                <div className="rounded bg-brand/15 px-1.5 py-0.5 text-[8px] font-medium text-brand">
                  On
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface-200 px-2.5 py-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-foreground">SMS verification</span>
                  <span className="text-[9px] text-foreground-muted">Code via text message</span>
                </div>
                <div className="rounded bg-foreground-muted/10 px-1.5 py-0.5 text-[8px] text-foreground-muted">
                  Off
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DataOwnershipSkeleton() {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      role="img"
      aria-label="A shield icon with a glowing green effect, representing user data ownership and security"
      className="relative flex h-full w-full items-center justify-center select-none"
      style={{
        maskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%, black 30%, transparent 75%)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Construction lines */}
      <svg
        className="absolute -inset-16 h-[calc(100%+128px)] w-[calc(100%+128px)] text-foreground-muted/20"
        viewBox="0 0 480 480"
        fill="none"
      >
        <rect
          x="60"
          y="40"
          width="360"
          height="400"
          rx="48"
          stroke="currentColor"
          strokeWidth="0.5"
        />
        <rect
          x="30"
          y="10"
          width="420"
          height="460"
          rx="60"
          stroke="currentColor"
          strokeWidth="0.5"
        />
        <rect
          x="0"
          y="-16"
          width="480"
          height="512"
          rx="72"
          stroke="currentColor"
          strokeWidth="0.5"
        />
        <rect
          x="90"
          y="70"
          width="300"
          height="340"
          rx="36"
          stroke="currentColor"
          strokeWidth="0.5"
        />
        <line x1="30" y1="10" x2="450" y2="470" stroke="currentColor" strokeWidth="0.5" />
        <line x1="450" y1="10" x2="30" y2="470" stroke="currentColor" strokeWidth="0.5" />
        <line x1="240" y1="0" x2="240" y2="480" stroke="currentColor" strokeWidth="0.5" />
        <line x1="0" y1="240" x2="480" y2="240" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="240" cy="240" r="180" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="240" cy="240" r="140" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="240" cy="240" r="100" stroke="currentColor" strokeWidth="0.5" />
        <line x1="60" y1="40" x2="60" y2="10" stroke="currentColor" strokeWidth="0.5" />
        <line x1="60" y1="40" x2="30" y2="40" stroke="currentColor" strokeWidth="0.5" />
        <line x1="420" y1="40" x2="450" y2="40" stroke="currentColor" strokeWidth="0.5" />
        <line x1="420" y1="40" x2="420" y2="10" stroke="currentColor" strokeWidth="0.5" />
        <line x1="60" y1="440" x2="30" y2="440" stroke="currentColor" strokeWidth="0.5" />
        <line x1="60" y1="440" x2="60" y2="470" stroke="currentColor" strokeWidth="0.5" />
        <line x1="420" y1="440" x2="450" y2="440" stroke="currentColor" strokeWidth="0.5" />
        <line x1="420" y1="440" x2="420" y2="470" stroke="currentColor" strokeWidth="0.5" />
      </svg>

      {/* Highlighted lines on hover */}
      <svg
        className="absolute -inset-16 h-[calc(100%+128px)] w-[calc(100%+128px)] transition-opacity duration-500"
        style={{ opacity: hovered ? 0.35 : 0 }}
        viewBox="0 0 480 480"
        fill="none"
      >
        <rect
          x="60"
          y="40"
          width="360"
          height="400"
          rx="48"
          stroke="hsl(var(--brand-default))"
          strokeWidth="0.75"
          opacity="0.4"
        />
        <circle
          cx="240"
          cy="240"
          r="140"
          stroke="hsl(var(--brand-default))"
          strokeWidth="0.75"
          opacity="0.3"
        />
        <line
          x1="240"
          y1="0"
          x2="240"
          y2="480"
          stroke="hsl(var(--brand-default))"
          strokeWidth="0.75"
          opacity="0.25"
        />
        <line
          x1="0"
          y1="240"
          x2="480"
          y2="240"
          stroke="hsl(var(--brand-default))"
          strokeWidth="0.75"
          opacity="0.25"
        />
      </svg>

      {/* Shield-user icon + glow */}
      <div className="relative h-44 w-44">
        <ShieldGlow hovered={hovered} />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="relative z-[5] h-44 w-44"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            color: 'hsl(var(--brand-default))',
          }}
        >
          <path
            d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
            fill="none"
            stroke="currentColor"
            strokeWidth={0.25}
          />
        </svg>
      </div>
    </div>
  )
}

export function FeaturesSection() {
  return (
    <SectionContainerWithCn spacing="sections">
      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
        <h3 className="text-2xl md:text-4xl text-foreground-lighter max-w-xl">
          Everything you need
          <br />
          <span className="text-foreground">for user authentication</span>
        </h3>
        <p className="text-foreground-lighter text-sm lg:text-base">
          Social logins, email/password, magic links, phone auth, and more — with enterprise-grade
          security built on Postgres&apos; Row Level Security.
        </p>
      </div>

      {/* 3-col grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {FEATURES.map((feature) => {
          const Visual = feature.visual
          return (
            <div
              key={feature.title}
              className="flex flex-col bg-surface-75 border border-border rounded-lg overflow-hidden"
            >
              <div className="relative flex items-center justify-center h-[320px]">
                <Visual />
              </div>
              <div className="px-6 py-5 flex flex-col gap-1">
                <h4 className="text-foreground text-sm font-medium">{feature.title}</h4>
                <p className="text-foreground-lighter text-sm">{feature.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </SectionContainerWithCn>
  )
}
