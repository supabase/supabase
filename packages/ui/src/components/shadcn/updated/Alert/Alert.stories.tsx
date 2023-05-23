// Button.stories.ts|tsx

import type { Meta, StoryObj } from '@storybook/react'

import { Alert, AlertProps } from './Alert'

import { IconAirplay } from '../Icon/icons/IconAirplay'
import { Terminal } from 'lucide-react'

const meta: Meta<typeof Alert> = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: 'General/Alert',
  component: Alert,
}

export default meta

type Story = StoryObj<typeof Alert>

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/react/api/csf
 * to learn how to use render functions.
 */

export const Info = {
  args: {
    variant: 'info',
    withIcon: true,
  },
  render: ({ withIcon, variant }: AlertProps) => (
    <Alert variant={variant} withIcon={withIcon}>
      <Alert.Title>Info Alert</Alert.Title>
      <Alert.Description>This is an informative message for your application.</Alert.Description>
    </Alert>
  ),
}

export const Danger = {
  args: {
    variant: 'danger',
    withIcon: true,
  },
  render: ({ withIcon, variant }: AlertProps) => (
    <Alert variant={variant} withIcon={withIcon}>
      <Alert.Title>Danger Alert</Alert.Title>
      <Alert.Description>This is a dangerous warning for your application.</Alert.Description>
    </Alert>
  ),
}

export const Warning = {
  args: {
    variant: 'warning',
    withIcon: true,
  },
  render: ({ withIcon, variant }: AlertProps) => (
    <Alert variant={variant} withIcon={withIcon}>
      <Alert.Title>Warning Alert</Alert.Title>
      <Alert.Description>This is a warning message for your application.</Alert.Description>
    </Alert>
  ),
}

export const Success = {
  args: {
    variant: 'success',
    withIcon: true,
  },
  render: ({ withIcon, variant }: AlertProps) => (
    <Alert variant={variant} withIcon={withIcon}>
      <Alert.Title>Success Alert</Alert.Title>
      <Alert.Description>This is a successful notification for your application.</Alert.Description>
    </Alert>
  ),
}

export const Neutral = {
  args: {
    variant: 'neutral',
    withIcon: true,
  },
  render: ({ withIcon, variant }: AlertProps) => (
    <Alert variant={variant} withIcon={withIcon}>
      <Alert.Title>Neutral Alert</Alert.Title>
      <Alert.Description>This is a neutral message for your application.</Alert.Description>
    </Alert>
  ),
}
