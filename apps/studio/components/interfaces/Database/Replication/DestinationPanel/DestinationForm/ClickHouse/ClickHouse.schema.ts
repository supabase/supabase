import * as z from 'zod'

export const ClickHouseFormSchema = z.object({
  clickhouseUrl: z.string().optional(),
  clickhouseUser: z.string().optional(),
  clickhousePassword: z.string().optional(),
  clickhouseDatabase: z.string().optional(),
  clickhouseEngine: z.enum(['merge_tree', 'replacing_merge_tree']).optional(),
})
