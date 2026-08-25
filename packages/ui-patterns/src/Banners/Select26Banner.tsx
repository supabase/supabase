'use client'

import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { SELECT_26_CTA, SELECT_26_TITLE, SELECT_26_URL, Select26Field } from './Select26Promotion'

export const Select26Banner = () => (
  <div className="relative isolate flex min-h-14 w-full items-center overflow-hidden border-b border-[#00482f]/15 bg-[#f8f3ef] px-4 py-2.5 pr-12 text-base font-medium text-[#001a10] dark:border-white/10 dark:bg-[#0b0e0d] dark:text-[#f8f3ef] sm:px-6 sm:pr-14">
    <Select26Field
      cols={7}
      rows={8}
      className="absolute -left-2 top-1/2 -z-10 hidden -translate-y-1/2 text-base opacity-[0.14] dark:opacity-[0.11] sm:grid"
    />
    <Select26Field
      cols={7}
      rows={8}
      className="absolute -right-2 top-1/2 -z-10 -translate-y-1/2 -scale-x-100 text-base opacity-[0.14] dark:opacity-[0.11]"
    />
    <div className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 hidden w-[min(100%,28rem)] -translate-x-1/2 bg-linear-to-r from-transparent via-[#f8f3ef] to-transparent dark:via-[#0b0e0d] sm:block" />
    <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-start gap-x-2 gap-y-1.5 sm:flex-nowrap sm:justify-center sm:gap-x-2.5">
      <p className="text-left leading-5 sm:text-center">
        {SELECT_26_TITLE}
        <span className="hidden sm:inline"> is coming October 2</span>
      </p>
      <span aria-hidden className="text-[#00482f]/20 dark:text-white/15">
        ▪
      </span>
      <Link
        href={SELECT_26_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex shrink-0 items-center gap-1 text-[#00482f] underline decoration-[#00482f]/35 underline-offset-4 transition-colors hover:decoration-[#00482f] dark:text-[#94e6b7] dark:decoration-[#94e6b7]/40 dark:hover:decoration-[#94e6b7]"
      >
        {SELECT_26_CTA}
        <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" />
      </Link>
    </div>
  </div>
)
