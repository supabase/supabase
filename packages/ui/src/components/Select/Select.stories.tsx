import React from 'react';
import Select from '.';
import { Props } from './Select';
import { IconBook } from './../Icon/icons/IconBook';

const { Option, OptGroup } = Select;

export default {
  title: 'Data Input/Select',
  component: Select,
};

const defaultOptions = [
  <Option value="javascript">JavaScript</Option>,
  <Option value="typeScript">TypeScript</Option>,
  <Option value="react">React</Option>,
];

const data = ['England', 'Wales', 'Scotland', 'Ireland'];
const icon = <IconBook type={'Book'} />;

export const Default = (args: Props) => <Select {...args}>{defaultOptions}</Select>;

export const WithCheckboxes = (args: Props) => (
  <Select {...args}>
    {data.map((item) => (
      <Option key={item} value={item}>
        {item}
      </Option>
    ))}
  </Select>
);


export const WithOptionGroup = (args: Props) => (
  <Select {...args}>
    <OptGroup label="languages">
      <Option value="javascript">JavaScript</Option>
      <Option value="typeScript">TypeScript</Option>
    </OptGroup>
    <OptGroup label="libraries">
      <Option value="react">React</Option>
    </OptGroup>
  </Select>
);

export const WithIcon = (args: Props) => <Select {...args}>{defaultOptions}</Select>;

export const WithOptionLabel = (args: Props) => <Select {...args}>{defaultOptions}</Select>;

export const WithBeforeAndAfterLabel = (args: Props) => (
  <Select {...args}>{defaultOptions}</Select>
);

export const WithDescription = (args: Props) => <Select {...args}>{defaultOptions}</Select>;

export const Size = (args: Props) => <Select {...args}>{defaultOptions}</Select>;

Default.args = {
  disabled: false,
  label: 'Label',
  className: 'font-sans',
  layout: 'vertical',
};

WithOptionGroup.args = {
  placeholder: 'Type text here ...',
  disabled: false,
  label: 'Input with an error message',
  className: 'font-sans',
  value: 'Value of input',
  layout: 'vertical',
};

WithCheckboxes.args = {
  disabled: false,
  checkboxes: data,
  allowedValues: data,
  className: 'font-sans',
  layout: 'vertical',
};

WithIcon.args = {
  placeholder: 'Type text here ...',
  disabled: false,
  label: 'Input with an Icon',
  className: 'font-sans',
  value: 'Value of input',
  icon: icon,
  allowedValues: data,
  layout: 'vertical',
};

WithOptionLabel.args = {
  placeholder: 'Type text here ...',
  disabled: false,
  label: 'Input with an error message',
  className: 'font-sans',
  value: 'Value of input',
  labelOptional: 'This is required',
  allowedValues: data,
  layout: 'vertical',
};

WithBeforeAndAfterLabel.args = {
  placeholder: 'Type text here ...',
  disabled: false,
  label: 'Label',
  beforeLabel: 'Before: ',
  afterLabel: ' :After',
  className: 'font-sans',
  value: 'Value of input',
  labelOptional: 'This is required',
  allowedValues: data,
  layout: 'vertical',
};

WithDescription.args = {
  placeholder: 'Type text here ...',
  disabled: false,
  label: 'Input with an error message',
  className: 'font-sans',
  value: 'Value of input',
  descriptionText: 'Make your password short and easy to guess',
  allowedValues: data,
  layout: 'vertical',
};

Size.args = {
  placeholder: 'Type text here ...',
  disabled: false,
  label: 'Input with a size selected',
  value: 'Value of input',
  descriptionText: 'Choose a different size and font, and padding will change',
  allowedValues: data,
  layout: 'vertical',
  size: 'tiny',
};
