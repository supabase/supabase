import { SerializeOptions as NextMdxRemoteSerializeOptions } from 'next-mdx-remote-client/serialize'

// The SerializeOptions is not exported from next-mdx-remote/serialize, so we need to
// manually define it here.
export type SerializeOptions = NextMdxRemoteSerializeOptions
