import React from 'react'
import { Meta } from '@storybook/react'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@ui/components/shadcn/ui/alert-dialog'

const meta: Meta<typeof AlertDialog> = {
  title: 'shadcn/AlertDialog',
  component: AlertDialog,
}

export const Default = () => (
  <AlertDialog>
    <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Dialog Title</AlertDialogTitle>
      </AlertDialogHeader>
      <AlertDialogDescription>This is the dialog description.</AlertDialogDescription>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction>OK</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)

Default.storyName = 'Default'

export default meta
