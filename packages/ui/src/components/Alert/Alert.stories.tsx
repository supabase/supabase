import React from 'react'

import { Alert, AlertProps } from './Alert'

export default {
  title: 'Displays/Alerts',
  component: Alert,
}

export const Neutral = (args: AlertProps) => (
  <Alert {...args}>
    Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
  </Alert>
)

export const Success = (args: AlertProps) => (
  <Alert {...args}>
    Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
  </Alert>
)

export const SuccessWithIcon = (args: AlertProps) => (
  <Alert {...args}>
    Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
  </Alert>
)

export const Danger = (args: AlertProps) => (
  <Alert {...args}>
    Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
  </Alert>
)

export const DangerWithIcon = (args: AlertProps) => (
  <Alert {...args}>
    Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
  </Alert>
)

export const Info = (args: AlertProps) => (
  <Alert {...args}>
    Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
  </Alert>
)

export const InfoWithIcon = (args: AlertProps) => (
  <Alert {...args}>
    Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
  </Alert>
)

export const Warning = (args: AlertProps) => (
  <Alert {...args}>
    Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
  </Alert>
)

export const WarningWithIcon = (args: AlertProps) => (
  <Alert {...args}>
    Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
  </Alert>
)

export const Closable = (args: AlertProps) => (
  <Alert {...args}>
    Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
  </Alert>
)

export const WithAction = (args: AlertProps) => (
  <Alert {...args}>
    Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
  </Alert>
)

Neutral.args = {
  title: 'Success alert with icon',
  withIcon: true,
}

Success.args = {
  title: 'Success alert',
  variant: 'success',
}

SuccessWithIcon.args = {
  title: 'Success alert with icon',
  variant: 'success',
  withIcon: true,
}

Danger.args = {
  title: 'Danger alert',
  variant: 'danger',
}

DangerWithIcon.args = {
  title: 'Danger alert with icon',
  variant: 'danger',
  withIcon: true,
}

Info.args = {
  title: 'Info alert',
  variant: 'info',
}

InfoWithIcon.args = {
  title: 'Info alert with icon',
  variant: 'info',
  withIcon: true,
}

Warning.args = {
  title: 'Warning alert',
  variant: 'warning',
}

WarningWithIcon.args = {
  title: 'Warning alert with icon',
  variant: 'warning',
  withIcon: true,
}

Closable.args = {
  title: 'Closable alert',
  closable: true,
}

WithAction.args = {
  title: 'Alert with action',
  variant: 'warning',
  withIcon: true,
  actions: <div>Hello</div>,
}
