import type { ClassValue } from 'cn'
import { createCn } from 'cn/config'

export type { ClassValue } from 'cn'

export const cn: (...inputs: ClassValue[]) => string = createCn({
  extend: {
    theme: {
      spacing: ['card', 'content'],
    },
  },
})
