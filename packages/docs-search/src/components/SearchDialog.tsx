'use client'

import { VisuallyHidden } from 'radix-ui'
import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from 'ui'

import { resolveSearchLabels } from './labels'
import type { SearchLabels } from './types'

export interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Rendered inside the dialog, which unmounts it on close. Usually a `SearchPanel`. */
  children: ReactNode
  labels?: Partial<Pick<SearchLabels, 'dialogTitle' | 'dialogDescription'>>
}

export function SearchDialog({ open, onOpenChange, children, labels }: SearchDialogProps) {
  const { dialogTitle, dialogDescription } = resolveSearchLabels(labels)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        centered={false}
        dialogOverlayProps={{
          className:
            'data-closed:animate-out! data-closed:fade-out-0 data-closed:fill-mode-forwards data-closed:duration-150 data-closed:ease-enter pt-20 sm:pt-20',
        }}
        size="large"
        className="overflow-hidden rounded-lg border-0 p-0 inset-ring inset-ring-border shadow-(--shadow-codeblock)!"
      >
        <VisuallyHidden.VisuallyHidden>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </VisuallyHidden.VisuallyHidden>
        {children}
      </DialogContent>
    </Dialog>
  )
}
