import { bff } from '@/lib/console-bff'

// [console fork] No billing in this product: never any overdue invoices.
// The dashboard hook calls `.filter` on the response, so return a bare array.
export default bff({
  GET: async (_req, res) => res.status(200).json([]),
})
