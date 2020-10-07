import React from 'react';

import { Button } from '.'

export default {
  title: 'Basic/Button',
  component: Button,
};

const Template = (args) => <Button {...args} />;

export const Primary = (args) => <Button>
  Some Children
</Button>
