import { serialize } from 'next-mdx-remote/serialize'

// The SerializeOptions is not exported from next-mdx-remote/serialize, so we need to
// manually define it here.
export type SerializeOptions = Parameters<typeof serialize>[1]
