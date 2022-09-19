import React from 'react'

import { action } from '@storybook/addon-actions'

import Radio from '.'

const stackedOptions = [
  {
    label: 'Hobby',
    description: '8GB / 4 CPUs · 160 GB SSD disk',
    value: '1',
    align: 'vertical',
    optionalLabel: <div>$40 / mo</div>,
  },
  {
    label: 'Startup',
    description: '12GB / 6 CPUs · 256 GB SSD disk',
    value: '2',
    align: 'vertical',
    optionalLabel: <div>$40 / mo</div>,
  },
  {
    label: 'Business',
    description: '16GB / 8 CPUs · 512 GB SSD disk',
    value: '3',
    align: 'vertical',
    optionalLabel: <div>$40 / mo</div>,
  },
  {
    label: 'Enterprise',
    description: '32GB / 12 CPUs · 1024 GB SSD disk',
    value: '4',
    align: 'vertical',
    optionalLabel: <div>$40 / mo</div>,
  },
]

const smallOptions = [
  {
    label: '4 GB',
    value: '1',
  },
  {
    label: '8GB',
    value: '2',
  },
  {
    label: '16GB',
    value: '3',
  },
  {
    label: '32GB',
    value: '3',
  },
  {
    label: '64GB',
    value: '4',
  },
  {
    label: '128GB',
    value: '5',
    disabled: true,
  },
]

const options = [
  {
    label: 'Comments',
    description:
      'Get notified when someones posts a comment on a posting. Get notified when someones posts a comment on a posting Get notified when someones posts a comment on a posting.',
    value: '1',
    align: 'vertical',
  },
  {
    label: 'Candidates',
    description:
      'Get notified when a candidate applies for a job. Get notified when a candidate applies for a job. Get notified when a candidate applies for a job. Get notified when a candidate applies for a job. Get notified when a candidate applies for a job. ',
    value: '2',
    align: 'vertical',
  },
  {
    label: 'Offers',
    description: 'Get notified when a candidate accepts or rejects an offer.',
    value: '3',
    align: 'vertical',
  },
  {
    label: 'Offers4',
    description: 'Get notified when a candidate accepts or rejects an offer.',
    value: '4',
    align: 'vertical',
  },
  {
    label: 'Offers5',
    description: 'Get notified when a candidate accepts or rejects an offer.',
    value: '5',
    align: 'vertical',
  },
]

export default {
  title: 'Data Input/Radio',
  component: Radio,
  argTypes: { onChange: { action: 'onChange' } },
}

interface onToggleProps {
  e?: any
}

export const SimpleList = (args: any) => (
  <Radio.Group {...args} onChange={action('onChange')}>
    <Radio label="Email" value={1} />
    <Radio label="Phone" value={2} />
    <Radio label="SMS" value={3} />
  </Radio.Group>
)

SimpleList.args = {
  descriptionText: 'This is optional description',
  label: 'Radio group main label',
  labelOptional: 'This is an optional label',
  layout: 'vertical',
  name: 'SimpleList-example',
  align: 'vertical',
}

export const ListWithDescription = (args: any) => (
  <Radio.Group {...args} onChange={action('onChange')}>
    <Radio
      label="Small"
      description="4 GB RAM / 2 CPUS / 80 GB SSD Storage"
      value={1}
    />
    <Radio
      label="Medium"
      description="8 GB RAM / 4 CPUS / 160 GB SSD Storage"
      value={2}
    />
    <Radio
      label="Large"
      description="16 GB RAM / 8 CPUS / 320 GB SSD Storag"
      value={3}
    />
  </Radio.Group>
)

ListWithDescription.args = {
  descriptionText: 'This is optional description',
  label: 'Radio group main label',
  labelOptional: 'This is an optional label',
  layout: 'vertical',
  name: 'radiogroup-example-1',
  align: 'vertical',
}

export const ListWithInlineDescription = (args: any) => (
  <Radio.Group {...args} onChange={action('onChange')}>
    <Radio
      label="Small"
      description="4 GB RAM / 2 CPUS / 80 GB SSD Storage"
      value={1}
      align="horizontal"
    />
    <Radio
      label="Medium"
      description="8 GB RAM / 4 CPUS / 160 GB SSD Storage"
      value={2}
      align="horizontal"
    />
    <Radio
      label="Large"
      description="16 GB RAM / 8 CPUS / 320 GB SSD Storag"
      value={3}
      align="horizontal"
    />
  </Radio.Group>
)

ListWithInlineDescription.args = {
  descriptionText: 'This is optional description',
  label: 'Radio group main label',
  labelOptional: 'This is an optional label',
  layout: 'vertical',
  name: 'radiogroup-example-1',
  align: 'vertical',
}

export const largeCards = (args: any) => (
  <Radio.Group {...args} onChange={action('onChange')}>
    <Radio
      label="Small"
      description="4 GB RAM / 2 CPUS / 80 GB SSD Storage"
      value={1}
      align={args.align}
      optionalLabel="Something"
    />
    <Radio
      label="Medium"
      description="8 GB RAM / 4 CPUS / 160 GB SSD Storage"
      value={2}
      align={args.align}
      optionalLabel="Something"
    />
    <Radio
      label="Large"
      description="16 GB RAM / 8 CPUS / 320 GB SSD Storag"
      value={3}
      align={args.align}
      optionalLabel="Something"
    />
  </Radio.Group>
)

largeCards.args = {
  descriptionText: 'This is optional description',
  label: 'Radio group main label',
  labelOptional: 'This is an optional label',
  layout: 'vertical',
  name: 'radiogroup-example-1',
  align: 'vertical',
  type: 'large-cards',
}

export const withOptionsObj = (args: any) => <Radio.Group {...args} />

export const withCards = (args: any) => (
  <Radio.Group {...args} onChange={action('onChange')}>
    {options.map((x, i) => (
      <Radio
        align={args.align}
        name="sbui-radiogroup"
        key={i}
        label={x.label}
        description={x.description}
        value={x.value}
      />
    ))}
  </Radio.Group>
)

export const withStackedCards = (args: any) => (
  <Radio.Group {...args} onChange={action('onChange')}>
    {stackedOptions.map((x, i) => (
      <Radio
        name="sbui-radiogroup"
        key={i}
        align={args.align}
        label={x.label}
        description={x.description}
        value={x.value}
        hidden={true}
        optionalLabel={x.optionalLabel}
      />
    ))}
  </Radio.Group>
)

export const withSmallCards = (args: any) => (
  <Radio.Group {...args} onChange={action('onChange')}>
    {smallOptions.map((x, i) => (
      <Radio
        name="sbui-radiogroup"
        key={i}
        label={x.label}
        value={x.value}
        hidden={true}
        disabled={x.disabled}
      />
    ))}
  </Radio.Group>
)

export const withCardsAndOptions = (args: any) => <Radio.Group {...args} />

export const withBeforeAndAfterLabels = (args: any) => <Radio.Group {...args} />

withOptionsObj.args = {
  className: 'font-sans',
  descriptionText: 'This is optional description',
  disabled: false,
  error: '',
  label: 'Radio group main label',
  labelOptional: 'This is an optional label',
  layout: 'vertical',
  name: 'radiogroup-example-2',
  options: options,
}

withCards.args = {
  className: 'font-sans',
  descriptionText: 'This is optional description',
  disabled: false,
  error: '',
  label: 'Radio group main label',
  labelOptional: 'This is an optional label',
  layout: 'horizontal',
  name: 'radiogroup-example-3',
  type: 'cards',
  align: 'vertical',
}

withStackedCards.args = {
  className: 'font-sans',
  descriptionText: 'This is optional description',
  disabled: false,
  error: '',
  label: 'Radio group main label',
  labelOptional: 'This is an optional label',
  layout: 'horizontal',
  name: 'radiogroup-example-3',
  type: 'stacked-cards',
  align: 'vertical',
}

withSmallCards.args = {
  className: 'font-sans',
  descriptionText: 'This is optional description',
  disabled: false,
  error: '',
  label: 'Radio group main label',
  labelOptional: 'This is an optional label',
  layout: 'vertical',
  name: 'radiogroup-example-3',
  type: 'small-cards',
  align: 'horizontal',
}

withCardsAndOptions.args = {
  className: 'font-sans',
  descriptionText: 'This is optional description',
  disabled: false,
  error: '',
  label: 'Radio group main label',
  labelOptional: 'This is an optional label',
  layout: 'horizontal',
  name: 'radiogroup-example-3',
  options: options,
  type: 'cards',
  align: 'vertical',
}

withBeforeAndAfterLabels.args = {
  label: 'Label',
  beforeLabel: 'Before : ',
  afterLabel: ' : After',
  options: [
    {
      label: 'Label',
      beforeLabel: 'Before : ',
      afterLabel: ' : After',
      description: 'Description',
    },
  ],
}
