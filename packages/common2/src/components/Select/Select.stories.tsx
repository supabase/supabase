import React from 'react'

import Select from '.'
import { IconBook } from '../../index'

const { Option, OptGroup } = Select

export default {
  title: 'Data Input/Select',
  component: Select,
}

export const Default = (args: any) => (
  <Select {...args}>
    <Option value="javascript">JavaScript</Option>
    <Option value="typeScript">TypeScript</Option>
    <Option value="react">React</Option>
  </Select>
)

export const withCheckboxes = (args: any) => <Select {...args} />

export const ErrorState = (args: any) => (
  <Select {...args}>
    <Option value="javascript">JavaScript</Option>
    <Option value="typeScript">TypeScript</Option>
    <Option value="react">React</Option>
  </Select>
)

export const withOptionGroup = (args: any) => (
  <Select {...args}>
    <OptGroup label="languages">
      <Option value="javascript">JavaScript</Option>
      <Option value="typeScript">TypeScript</Option>
    </OptGroup>
    <OptGroup label="libaries">
      <Option value="react">React</Option>
    </OptGroup>
  </Select>
)

export const withIcon = (args: any) => (
  <Select {...args}>
    <Option value="javascript">JavaScript</Option>
    <Option value="typeScript">TypeScript</Option>
    <Option value="react">React</Option>
  </Select>
)

export const withOptionLabel = (args: any) => (
  <Select {...args}>
    <Option value="javascript">JavaScript</Option>
    <Option value="typeScript">TypeScript</Option>
    <Option value="react">React</Option>
  </Select>
)

export const withBeforeAndAfterLabel = (args: any) => (
  <Select {...args}>
    <Option value="javascript">JavaScript</Option>
    <Option value="typeScript">TypeScript</Option>
    <Option value="react">React</Option>
  </Select>
)

export const withDescription = (args: any) => (
  <Select {...args}>
    <Option value="javascript">JavaScript</Option>
    <Option value="typeScript">TypeScript</Option>
    <Option value="react">React</Option>
  </Select>
)

export const size = (args: any) => (
  <Select {...args}>
    <Option value="javascript">JavaScript</Option>
    <Option value="typeScript">TypeScript</Option>
    <Option value="react">React</Option>
  </Select>
)

const data = ['England', 'Wales', 'Scotland', 'Ireland']
const icon = <IconBook type={'Book'} />

Default.args = {
  disabled: false,
  label: 'Label',
  className: 'font-sans',
  layout: 'vertical',
  children: [
    <>
      <Option value="javascript">JavaScript</Option>
      <Option value="typeScript">TypeScript</Option>
      <Option value="react">React</Option>
    </>,
  ],
}

withOptionGroup.args = {
  placeholder: 'Type text here ...',
  disabled: false,
  label: 'Input with an error message',
  className: 'font-sans',
  value: 'Value of input',
  layout: 'vertical',
}

withCheckboxes.args = {
  disabled: false,
  checkboxes: data,
  allowedValues: data,
  className: 'font-sans',
  layout: 'vertical',
}

ErrorState.args = {
  placeholder: 'Type text here ...',
  disabled: false,
  label: 'Input with an error message',
  className: 'font-sans',
  value: 'Value of input',
  error: 'Your password must be less than 4 characters.',
  allowedValues: data,
  layout: 'vertical',
}

withIcon.args = {
  placeholder: 'Type text here ...',
  disabled: false,
  label: 'Input with an Icon',
  className: 'font-sans',
  value: 'Value of input',
  icon: icon,
  allowedValues: data,
  layout: 'vertical',
}

withOptionLabel.args = {
  placeholder: 'Type text here ...',
  disabled: false,
  label: 'Input with an error message',
  className: 'font-sans',
  value: 'Value of input',
  labelOptional: 'This is required',
  allowedValues: data,
  layout: 'vertical',
}

withBeforeAndAfterLabel.args = {
  placeholder: 'Type text here ...',
  disabled: false,
  label: 'Label',
  beforeLabel: 'Before : ',
  afterLabel: ' : After',
  className: 'font-sans',
  value: 'Value of input',
  labelOptional: 'This is required',
  allowedValues: data,
  layout: 'vertical',
}

withDescription.args = {
  placeholder: 'Type text here ...',
  disabled: false,
  label: 'Input with an error message',
  className: 'font-sans',
  value: 'Value of input',
  descriptionText: 'Make your password short and easy to guess',
  allowedValues: data,
  layout: 'vertical',
}

size.args = {
  placeholder: 'Type text here ...',
  disabled: false,
  label: 'Input with a size selected',
  value: 'Value of input',
  descriptionText: 'Choose a different size and font and padding will change',
  allowedValues: data,
  layout: 'vertical',
  size: 'tiny',
}
