import React from 'react'

import Accordion, { AccordionProps } from './Accordion'
import { Badge } from '../Badge'

export default {
  title: 'Displays/Accordion',
  component: Accordion,
}

export const OneItem = (args: AccordionProps) => (
  <Accordion {...args} justified={false}>
    <Accordion.Item
      header={
        <>
          <span className="text-foreground-muted group-hover:text-foreground">
            Title of the thing
          </span>
          <Badge>Test badge</Badge>
        </>
      }
      id="first"
    >
      <span className="text-foreground-muted">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
      </span>
    </Accordion.Item>
  </Accordion>
)

export const MultipleItems = (args: AccordionProps) => (
  <Accordion {...args} openBehaviour="multiple">
    <Accordion.Item
      header={
        <span className="text-foreground-muted group-hover:text-foreground">
          Title of the thing
        </span>
      }
      id={'1'}
    >
      <span className="text-foreground-muted">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
      </span>
    </Accordion.Item>
    <Accordion.Item
      header={
        <span className="text-foreground-muted group-hover:text-foreground">
          Title of the thing
        </span>
      }
      id={'2'}
    >
      <span className="text-foreground-muted">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
      </span>
    </Accordion.Item>
    <Accordion.Item
      header={
        <span className="text-foreground-muted group-hover:text-foreground">
          Title of the thing
        </span>
      }
      id={'3'}
    >
      <span className="text-foreground-muted">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
      </span>
    </Accordion.Item>
    <Accordion.Item
      header={
        <span className="text-foreground-muted group-hover:text-foreground">
          Title of the thing
        </span>
      }
      id={'4'}
    >
      <span className="text-foreground-muted">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
      </span>
    </Accordion.Item>
  </Accordion>
)

export const Bordered = (args: AccordionProps) => (
  <Accordion {...args}>
    <Accordion.Item
      header={
        <span className="text-foreground-muted group-hover:text-foreground">
          Title of the thing
        </span>
      }
      id={'1'}
    >
      <span className="text-foreground-muted">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
      </span>
    </Accordion.Item>
    <Accordion.Item
      header={
        <span className="text-foreground-muted group-hover:text-foreground">
          Title of the thing
        </span>
      }
      id={'2'}
    >
      <span className="text-foreground-muted">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
      </span>
    </Accordion.Item>
    <Accordion.Item
      header={
        <span className="text-foreground-muted group-hover:text-foreground">
          Title of the thing
        </span>
      }
      id={'3'}
    >
      <span className="text-foreground-muted">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
      </span>
    </Accordion.Item>
    <Accordion.Item
      header={
        <span className="text-foreground-muted group-hover:text-foreground">
          Title of the thing
        </span>
      }
      id={'4'}
    >
      <span className="text-foreground-muted">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
      </span>
    </Accordion.Item>
  </Accordion>
)

Bordered.args = {
  type: 'bordered',
}

export const LeftAlignedChevron = (args: AccordionProps) => (
  <Accordion {...args} justified={false} chevronAlign="left">
    <Accordion.Item
      header={
        <>
          <span className="text-foreground-muted group-hover:text-foreground">First item</span>
          <Badge>Test badge</Badge>
        </>
      }
      id="first"
    >
      <span className="text-foreground-muted">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
      </span>
    </Accordion.Item>
    <Accordion.Item
      header={
        <>
          <span className="text-foreground-muted group-hover:text-foreground">Second item</span>
        </>
      }
      id="second"
    >
      <span className="text-foreground-muted">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
      </span>
    </Accordion.Item>
  </Accordion>
)

// export const withDefaultActive = Multiple.bind({})
// withDefaultActive.args = {
//   defaultActiveId: [1],
// }

// export const withIconLeft = Multiple.bind({})
// withIconLeft.args = {
//   iconPosition: 'left',
// }

// export const withCustomIcon = Multiple.bind({})
// withCustomIcon.args = {
//   icon: <IconArrowUp />,
// }
