'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'

const LocalDXImage = dynamic(() => import('~/components/Products/Functions/LocalDXImage'))
const ParityImage = dynamic(() => import('~/components/Products/Functions/ParityImage'))
const NpmEcosystem = dynamic(() => import('~/components/Products/Functions/NpmEcosystem'))
const CI = dynamic(() => import('~/components/Products/Functions/CI'))

function EcosystemCard() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="flex flex-col bg-surface-75 border border-border rounded-lg overflow-hidden  col-span-1 md:row-span-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex-1 relative overflow-hidden min-h-[320px] md:min-h-0">
        <NpmEcosystem isHovered={isHovered} />
      </div>
      <div className="flex flex-col gap-1 px-6 py-5">
        <h4 className="text-foreground text-sm font-medium">Use any NPM module</h4>
        <p className="text-foreground-lighter text-sm">
          Tap into the 2+ million modules in the Deno and NPM ecosystem
        </p>
      </div>
    </div>
  )
}

function ParityCard() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="flex flex-col bg-surface-75 border border-border rounded-lg overflow-hidden "
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-[3/2] w-full flex items-center justify-center overflow-hidden">
        <ParityImage isHovered={isHovered} />
      </div>
      <div className="flex flex-col gap-1 px-6 py-5">
        <h4 className="text-foreground text-sm font-medium">Dev and Prod parity</h4>
        <p className="text-foreground-lighter text-sm">
          The open source{' '}
          <Link
            href="https://github.com/supabase/edge-runtime/"
            className="underline hover:text-foreground-light transition-colors"
            target="_blank"
          >
            Edge runtime
          </Link>{' '}
          runs locally in dev and powers functions in production
        </p>
      </div>
    </div>
  )
}

function CICard() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="flex flex-col bg-surface-75 border border-border rounded-lg overflow-hidden  md:col-span-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="flex-1 flex items-center justify-center overflow-hidden pl-2 pt-8 md:pt-12"
        style={{
          maskImage: 'linear-gradient(to bottom, black 95%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 95%, transparent 100%)',
        }}
      >
        <CI isHovered={isHovered} />
      </div>
      <div className="flex flex-col gap-1 px-6 py-5">
        <h4 className="text-foreground text-sm font-medium">Continuous Integration</h4>
        <p className="text-foreground-lighter text-sm">
          Use the{' '}
          <Link
            href="https://supabase.com/docs/guides/functions/cicd-workflow"
            className="underline hover:text-foreground-light transition-colors"
            target="_blank"
          >
            Supabase CLI with GitHub actions
          </Link>{' '}
          to preview and deploy your functions along with the rest of your application
        </p>
      </div>
    </div>
  )
}

function LocalDXCard() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="flex flex-col bg-surface-75 border border-border rounded-lg overflow-hidden "
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-[3/2] w-full flex items-center justify-center overflow-hidden">
        <LocalDXImage isHovered={isHovered} />
      </div>
      <div className="flex flex-col gap-1 px-6 py-5">
        <h4 className="text-foreground text-sm font-medium">First-class local dev experience</h4>
        <p className="text-foreground-lighter text-sm">
          Write code with hot code reloading, a fast Language server for autocompletion, type
          checking and linting
        </p>
      </div>
    </div>
  )
}

export function LocalDXSection() {
  return (
    <div className="py-24 flex flex-col gap-16">
      {/* Header */}
      <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-end">
          <h3 className="text-2xl md:text-4xl text-foreground-lighter max-w-xl">
            Delightful DX from <br />
            <span className="text-foreground">local to production</span>
          </h3>
          <p className="text-foreground-lighter text-sm lg:text-base">
            Edge Functions are developed using{' '}
            <Link
              href="https://deno.com/"
              className="underline hover:text-foreground-light transition-colors"
              target="_blank"
            >
              Deno
            </Link>
            , an open source JavaScript runtime that ensures maximum power and flexibility. Migrate
            in and out at any time with no vendor lock-in.
          </p>
        </div>
      </div>

      {/* Bento grid */}
      <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 grid-flow-dense gap-3">
          <LocalDXCard />
          <ParityCard />
          <CICard />
          <EcosystemCard />
        </div>
      </div>
    </div>
  )
}
