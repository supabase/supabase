'use client'

import { motion } from 'framer-motion'
import { Check, Copy, Download, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import { Button } from 'ui'

import type { MergeResult } from '../lib/composer'

interface CreateProjectOverlayProps {
  mergeResult: MergeResult
  onClose: () => void
  onDownload: () => void
}

export function CreateProjectOverlay({
  mergeResult,
  onClose,
  onDownload,
}: CreateProjectOverlayProps) {
  const [copied, setCopied] = useState(false)
  const command = `supabase init --composition ${mergeResult.compositionId}`

  function handleCopy() {
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-6 backdrop-blur-sm">
      <Button
        type="text"
        size="tiny"
        className="absolute top-4 right-4 h-8 w-8 px-0"
        icon={<X className="h-4 w-4" />}
        onClick={onClose}
        aria-label="Close create project overlay"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex w-full max-w-md flex-col items-center text-center"
      >
        <motion.div
          className="mb-4"
          style={{ transformOrigin: '50% 85%' }}
          animate={{ rotate: [0, -5, 5, -4, 4, 0] }}
          transition={{
            duration: 0.45,
            times: [0, 0.15, 0.3, 0.5, 0.7, 1],
            repeat: Infinity,
            repeatDelay: 2.75,
            ease: 'easeInOut',
          }}
        >
          <Image
            src="/images/composer/create-project-folder.svg"
            width={240}
            height={200}
            alt=""
            className="h-28 w-auto"
          />
        </motion.div>

        <p className="text-lg font-medium text-foreground">Your composition is ready</p>
        <p className="mt-2 text-sm text-foreground-light">
          Run it locally with the CLI, download the code, or create a new project on Supabase.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3">
          <div className="flex h-10 items-center gap-2 rounded-md border bg-surface-75 px-3 font-mono text-xs text-foreground-light">
            <span className="shrink-0 text-foreground-muted">$</span>
            <code className="min-w-0 flex-1 truncate text-left text-foreground">{command}</code>
            <CopyToClipboard text={command}>
              <button
                type="button"
                aria-label="Copy composition command"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-foreground-light hover:bg-surface-200"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-brand" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </CopyToClipboard>
          </div>

          <Button type="secondary" size="small" block icon={<Download />} onClick={onDownload}>
            Download ZIP
          </Button>

          <Button asChild block type="default" size="small">
            <Link href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
              Create project
            </Link>
          </Button>

          <Button type="text" size="small" className="text-foreground-lighter" onClick={onClose}>
            Keep composing
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
