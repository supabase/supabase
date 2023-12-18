import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import StackedAreaChart from './StackedAreaChart'

export default {
  title: 'Charts/StackedAreaChart',
  component: StackedAreaChart,
} as ComponentMeta<typeof StackedAreaChart>

const Template: ComponentStory<typeof StackedAreaChart> = (args) => <StackedAreaChart {...args} />

export const Default = Template.bind({})
Default.args = {
  stackKey: 'status_code',
  xAxisKey: 'timestamp',
  yAxisKey: 'count',
  isLoading: false,
  xAxisFormatAsDate: true,
  size: 'large',
  dateFormat: 'MMM D, ha',
  data: [
    {
      count: 8656,
      status_code: 503,
      timestamp: 1647777600000000,
    },
    {
      count: 2,
      status_code: 524,
      timestamp: 1647777600000000,
    },
    {
      count: 502195,
      status_code: 200,
      timestamp: 1647777600000000,
    },
    {
      count: 423,
      status_code: 204,
      timestamp: 1647777600000000,
    },
    {
      count: 1,
      status_code: 429,
      timestamp: 1647777600000000,
    },
    {
      count: 27,
      status_code: 304,
      timestamp: 1647777600000000,
    },
    {
      count: 1052,
      status_code: 206,
      timestamp: 1647777600000000,
    },
    {
      count: 1,
      status_code: 101,
      timestamp: 1647777600000000,
    },
    {
      count: 51,
      status_code: 404,
      timestamp: 1647777600000000,
    },
    {
      count: 191,
      status_code: 400,
      timestamp: 1647777600000000,
    },
    {
      count: 46,
      status_code: 303,
      timestamp: 1647777600000000,
    },
    {
      count: 1,
      status_code: 416,
      timestamp: 1647777600000000,
    },
    {
      count: 71635,
      status_code: 401,
      timestamp: 1647777600000000,
    },
    {
      count: 437,
      status_code: 201,
      timestamp: 1647777600000000,
    },
    {
      count: 5,
      status_code: 409,
      timestamp: 1647777600000000,
    },
    {
      count: 48,
      status_code: 303,
      timestamp: 1647781200000000,
    },
    {
      count: 257,
      status_code: 400,
      timestamp: 1647781200000000,
    },
    {
      count: 7,
      status_code: 404,
      timestamp: 1647781200000000,
    },
    {
      count: 2,
      status_code: 416,
      timestamp: 1647781200000000,
    },
    {
      count: 1093,
      status_code: 206,
      timestamp: 1647781200000000,
    },
    {
      count: 1,
      status_code: 524,
      timestamp: 1647781200000000,
    },
    {
      count: 7,
      status_code: 409,
      timestamp: 1647781200000000,
    },
    {
      count: 1,
      status_code: 500,
      timestamp: 1647781200000000,
    },
    {
      count: 530460,
      status_code: 200,
      timestamp: 1647781200000000,
    },
    {
      count: 490,
      status_code: 204,
      timestamp: 1647781200000000,
    },
    {
      count: 6963,
      status_code: 503,
      timestamp: 1647781200000000,
    },
    {
      count: 70794,
      status_code: 401,
      timestamp: 1647781200000000,
    },
    {
      count: 441,
      status_code: 201,
      timestamp: 1647781200000000,
    },
    {
      count: 14,
      status_code: 304,
      timestamp: 1647781200000000,
    },
    {
      count: 1,
      status_code: 502,
      timestamp: 1647781200000000,
    },
    {
      count: 2,
      status_code: 429,
      timestamp: 1647781200000000,
    },
    {
      count: 255,
      status_code: 400,
      timestamp: 1647784800000000,
    },
    {
      count: 3,
      status_code: 429,
      timestamp: 1647784800000000,
    },
    {
      count: 475,
      status_code: 201,
      timestamp: 1647784800000000,
    },
    {
      count: 469,
      status_code: 204,
      timestamp: 1647784800000000,
    },
    {
      count: 7,
      status_code: 404,
      timestamp: 1647784800000000,
    },
    {
      count: 2,
      status_code: 524,
      timestamp: 1647784800000000,
    },
    {
      count: 12624,
      status_code: 503,
      timestamp: 1647784800000000,
    },
    {
      count: 8,
      status_code: 409,
      timestamp: 1647784800000000,
    },
    {
      count: 23,
      status_code: 304,
      timestamp: 1647784800000000,
    },
    {
      count: 508621,
      status_code: 200,
      timestamp: 1647784800000000,
    },
    {
      count: 751,
      status_code: 206,
      timestamp: 1647784800000000,
    },
    {
      count: 2,
      status_code: 416,
      timestamp: 1647784800000000,
    },
    {
      count: 53,
      status_code: 303,
      timestamp: 1647784800000000,
    },
    {
      count: 70778,
      status_code: 401,
      timestamp: 1647784800000000,
    },
    {
      count: 1,
      status_code: 502,
      timestamp: 1647788400000000,
    },
    {
      count: 372,
      status_code: 204,
      timestamp: 1647788400000000,
    },
    {
      count: 71464,
      status_code: 401,
      timestamp: 1647788400000000,
    },
    {
      count: 38,
      status_code: 303,
      timestamp: 1647788400000000,
    },
    {
      count: 502675,
      status_code: 200,
      timestamp: 1647788400000000,
    },
    {
      count: 20941,
      status_code: 503,
      timestamp: 1647788400000000,
    },
    {
      count: 409,
      status_code: 201,
      timestamp: 1647788400000000,
    },
    {
      count: 889,
      status_code: 206,
      timestamp: 1647788400000000,
    },
    {
      count: 52,
      status_code: 304,
      timestamp: 1647788400000000,
    },
    {
      count: 1,
      status_code: 409,
      timestamp: 1647788400000000,
    },
    {
      count: 48,
      status_code: 404,
      timestamp: 1647788400000000,
    },
    {
      count: 345,
      status_code: 400,
      timestamp: 1647788400000000,
    },
    {
      count: 1,
      status_code: 416,
      timestamp: 1647788400000000,
    },
    {
      count: 9,
      status_code: 416,
      timestamp: 1647792000000000,
    },
    {
      count: 12694,
      status_code: 503,
      timestamp: 1647792000000000,
    },
    {
      count: 554,
      status_code: 206,
      timestamp: 1647792000000000,
    },
    {
      count: 15,
      status_code: 304,
      timestamp: 1647792000000000,
    },
    {
      count: 269,
      status_code: 204,
      timestamp: 1647792000000000,
    },
    {
      count: 180,
      status_code: 201,
      timestamp: 1647792000000000,
    },
    {
      count: 4,
      status_code: 524,
      timestamp: 1647792000000000,
    },
    {
      count: 72056,
      status_code: 401,
      timestamp: 1647792000000000,
    },
    {
      count: 3,
      status_code: 429,
      timestamp: 1647792000000000,
    },
    {
      count: 1,
      status_code: 502,
      timestamp: 1647792000000000,
    },
    {
      count: 139,
      status_code: 400,
      timestamp: 1647792000000000,
    },
    {
      count: 37,
      status_code: 303,
      timestamp: 1647792000000000,
    },
    {
      count: 1,
      status_code: 409,
      timestamp: 1647792000000000,
    },
    {
      count: 81,
      status_code: 404,
      timestamp: 1647792000000000,
    },
    {
      count: 505478,
      status_code: 200,
      timestamp: 1647792000000000,
    },
    {
      count: 71971,
      status_code: 401,
      timestamp: 1647795600000000,
    },
    {
      count: 573,
      status_code: 206,
      timestamp: 1647795600000000,
    },
    {
      count: 35,
      status_code: 303,
      timestamp: 1647795600000000,
    },
    {
      count: 2790,
      status_code: 503,
      timestamp: 1647795600000000,
    },
    {
      count: 536343,
      status_code: 200,
      timestamp: 1647795600000000,
    },
    {
      count: 284,
      status_code: 204,
      timestamp: 1647795600000000,
    },
    {
      count: 9,
      status_code: 409,
      timestamp: 1647795600000000,
    },
    {
      count: 231,
      status_code: 400,
      timestamp: 1647795600000000,
    },
    {
      count: 32,
      status_code: 304,
      timestamp: 1647795600000000,
    },
    {
      count: 2,
      status_code: 524,
      timestamp: 1647795600000000,
    },
    {
      count: 9,
      status_code: 416,
      timestamp: 1647795600000000,
    },
    {
      count: 6,
      status_code: 429,
      timestamp: 1647795600000000,
    },
    {
      count: 8,
      status_code: 404,
      timestamp: 1647795600000000,
    },
    {
      count: 263,
      status_code: 201,
      timestamp: 1647795600000000,
    },
    {
      count: 2,
      status_code: 429,
      timestamp: 1647799200000000,
    },
    {
      count: 1,
      status_code: 404,
      timestamp: 1647799200000000,
    },
    {
      count: 1,
      status_code: 524,
      timestamp: 1647799200000000,
    },
    {
      count: 285,
      status_code: 201,
      timestamp: 1647799200000000,
    },
    {
      count: 680,
      status_code: 206,
      timestamp: 1647799200000000,
    },
    {
      count: 22,
      status_code: 304,
      timestamp: 1647799200000000,
    },
    {
      count: 3449,
      status_code: 503,
      timestamp: 1647799200000000,
    },
    {
      count: 1,
      status_code: 422,
      timestamp: 1647799200000000,
    },
    {
      count: 4,
      status_code: 409,
      timestamp: 1647799200000000,
    },
    {
      count: 8,
      status_code: 416,
      timestamp: 1647799200000000,
    },
    {
      count: 31,
      status_code: 303,
      timestamp: 1647799200000000,
    },
    {
      count: 549926,
      status_code: 200,
      timestamp: 1647799200000000,
    },
    {
      count: 151,
      status_code: 400,
      timestamp: 1647799200000000,
    },
    {
      count: 72473,
      status_code: 401,
      timestamp: 1647799200000000,
    },
    {
      count: 374,
      status_code: 204,
      timestamp: 1647799200000000,
    },
    {
      count: 27,
      status_code: 303,
      timestamp: 1647802800000000,
    },
    {
      count: 240,
      status_code: 201,
      timestamp: 1647802800000000,
    },
    {
      count: 493,
      status_code: 206,
      timestamp: 1647802800000000,
    },
    {
      count: 1,
      status_code: 502,
      timestamp: 1647802800000000,
    },
    {
      count: 19,
      status_code: 404,
      timestamp: 1647802800000000,
    },
    {
      count: 72814,
      status_code: 401,
      timestamp: 1647802800000000,
    },
    {
      count: 5,
      status_code: 409,
      timestamp: 1647802800000000,
    },
    {
      count: 112,
      status_code: 400,
      timestamp: 1647802800000000,
    },
    {
      count: 236,
      status_code: 204,
      timestamp: 1647802800000000,
    },
    {
      count: 3,
      status_code: 416,
      timestamp: 1647802800000000,
    },
    {
      count: 554578,
      status_code: 200,
      timestamp: 1647802800000000,
    },
    {
      count: 28,
      status_code: 304,
      timestamp: 1647802800000000,
    },
    {
      count: 1,
      status_code: 524,
      timestamp: 1647802800000000,
    },
    {
      count: 2733,
      status_code: 503,
      timestamp: 1647802800000000,
    },
    {
      count: 3,
      status_code: 429,
      timestamp: 1647802800000000,
    },
    {
      count: 566745,
      status_code: 200,
      timestamp: 1647806400000000,
    },
    {
      count: 369,
      status_code: 201,
      timestamp: 1647806400000000,
    },
    {
      count: 11,
      status_code: 416,
      timestamp: 1647806400000000,
    },
    {
      count: 1,
      status_code: 502,
      timestamp: 1647806400000000,
    },
    {
      count: 72115,
      status_code: 401,
      timestamp: 1647806400000000,
    },
    {
      count: 103,
      status_code: 400,
      timestamp: 1647806400000000,
    },
    {
      count: 756,
      status_code: 206,
      timestamp: 1647806400000000,
    },
    {
      count: 18,
      status_code: 304,
      timestamp: 1647806400000000,
    },
    {
      count: 19,
      status_code: 404,
      timestamp: 1647806400000000,
    },
    {
      count: 21,
      status_code: 303,
      timestamp: 1647806400000000,
    },
    {
      count: 367,
      status_code: 204,
      timestamp: 1647806400000000,
    },
    {
      count: 3174,
      status_code: 503,
      timestamp: 1647806400000000,
    },
    {
      count: 3,
      status_code: 524,
      timestamp: 1647806400000000,
    },
    {
      count: 208,
      status_code: 204,
      timestamp: 1647810000000000,
    },
    {
      count: 1,
      status_code: 404,
      timestamp: 1647810000000000,
    },
    {
      count: 71259,
      status_code: 401,
      timestamp: 1647810000000000,
    },
    {
      count: 3,
      status_code: 416,
      timestamp: 1647810000000000,
    },
    {
      count: 561794,
      status_code: 200,
      timestamp: 1647810000000000,
    },
    {
      count: 3503,
      status_code: 503,
      timestamp: 1647810000000000,
    },
    {
      count: 151,
      status_code: 400,
      timestamp: 1647810000000000,
    },
    {
      count: 14,
      status_code: 304,
      timestamp: 1647810000000000,
    },
    {
      count: 453,
      status_code: 206,
      timestamp: 1647810000000000,
    },
    {
      count: 4,
      status_code: 524,
      timestamp: 1647810000000000,
    },
    {
      count: 103,
      status_code: 201,
      timestamp: 1647810000000000,
    },
    {
      count: 8,
      status_code: 409,
      timestamp: 1647810000000000,
    },
    {
      count: 31,
      status_code: 303,
      timestamp: 1647810000000000,
    },
    {
      count: 1,
      status_code: 502,
      timestamp: 1647813600000000,
    },
    {
      count: 2,
      status_code: 409,
      timestamp: 1647813600000000,
    },
    {
      count: 23,
      status_code: 304,
      timestamp: 1647813600000000,
    },
    {
      count: 2,
      status_code: 524,
      timestamp: 1647813600000000,
    },
    {
      count: 564270,
      status_code: 200,
      timestamp: 1647813600000000,
    },
    {
      count: 15,
      status_code: 404,
      timestamp: 1647813600000000,
    },
    {
      count: 70733,
      status_code: 401,
      timestamp: 1647813600000000,
    },
    {
      count: 79,
      status_code: 400,
      timestamp: 1647813600000000,
    },
    {
      count: 617,
      status_code: 206,
      timestamp: 1647813600000000,
    },
    {
      count: 4,
      status_code: 429,
      timestamp: 1647813600000000,
    },
    {
      count: 3810,
      status_code: 503,
      timestamp: 1647813600000000,
    },
    {
      count: 35,
      status_code: 303,
      timestamp: 1647813600000000,
    },
    {
      count: 219,
      status_code: 204,
      timestamp: 1647813600000000,
    },
    {
      count: 3,
      status_code: 416,
      timestamp: 1647813600000000,
    },
    {
      count: 157,
      status_code: 201,
      timestamp: 1647813600000000,
    },
    {
      count: 3,
      status_code: 524,
      timestamp: 1647817200000000,
    },
    {
      count: 172,
      status_code: 201,
      timestamp: 1647817200000000,
    },
    {
      count: 552900,
      status_code: 200,
      timestamp: 1647817200000000,
    },
    {
      count: 21,
      status_code: 304,
      timestamp: 1647817200000000,
    },
    {
      count: 1,
      status_code: 429,
      timestamp: 1647817200000000,
    },
    {
      count: 246,
      status_code: 204,
      timestamp: 1647817200000000,
    },
    {
      count: 2,
      status_code: 409,
      timestamp: 1647817200000000,
    },
    {
      count: 446,
      status_code: 206,
      timestamp: 1647817200000000,
    },
    {
      count: 35,
      status_code: 303,
      timestamp: 1647817200000000,
    },
    {
      count: 233,
      status_code: 400,
      timestamp: 1647817200000000,
    },
  ],
}
