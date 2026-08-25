'use client'

import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import {
  SELECT_26_CTA,
  SELECT_26_MESSAGE,
  SELECT_26_URL,
  Select26Artwork,
  Select26Logo,
} from './Select26Promotion'

export const Select26Banner = () => (
  <div className="relative isolate flex min-h-14 w-full items-center overflow-hidden border-b border-[#00482f]/15 bg-[#f8f3ef] px-4 py-2 pr-12 text-[#001a10] dark:border-white/10 dark:bg-[#0b0e0d] dark:text-[#f8f3ef] sm:px-6 sm:pr-14">
    <Select26Artwork className="absolute -right-3 top-0 -z-10 h-full rotate-2 text-lg opacity-[0.16] dark:opacity-[0.12] sm:text-xl" />
    <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-5 gap-y-1.5 sm:flex-nowrap">
      <Select26Logo className="shrink-0 text-[11px]" />
      <span className="hidden h-5 w-px shrink-0 bg-[#00482f]/20 dark:bg-white/15 sm:block" />
      <p className="text-center text-xs font-medium leading-5 sm:text-sm">{SELECT_26_MESSAGE}</p>
      <Link
        href={SELECT_26_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#00482f] underline decoration-[#00482f]/35 underline-offset-4 transition-colors hover:decoration-[#00482f] dark:text-[#94e6b7] dark:decoration-[#94e6b7]/40 dark:hover:decoration-[#94e6b7] sm:text-sm"
      >
        {SELECT_26_CTA}
        <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" />
      </Link>
    </div>
  </div>
)
