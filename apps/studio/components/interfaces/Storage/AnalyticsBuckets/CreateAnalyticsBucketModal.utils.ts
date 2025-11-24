// [Joshen] These are referenced from the storage API directly here
// https://github.com/supabase/storage/blob/69e4a40799a9d10be0a63a37cbb46d7d9bea0e17/src/storage/limits.ts#L59

// only allow s3 safe characters and characters which require special handling for now
// the slash restriction come from bucket naming rules
// and the rest of the validation rules are based on S3 object key validation.
// https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
// https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html

export const reservedPrefixes = /^(?:xn--|sthree-|amzn-s3-demo-|aws)/
export const reservedSuffixes = /(?:-s3alias|--ol-s3|--x-s3|--table-s3)$/

// 1) only lowercase letters, digits, hyphens
// 2) must start and end with a letter or digit
export const validBucketNameRegex = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
export const invalidBucketNameRegex = /[^a-z0-9-]/

// export const validBucketNameRegex = /^(\w|!|-|\.|\*|'|\(|\)| |&|\$|@|=|;|:|\+|,|\?)*$/
// export const inverseValidBucketNameRegex = /[^A-Za-z0-9_!\-.*'() &$@=;:+,?]/

// only allow s3 safe characters and characters which require special handling for now
// https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
export const validObjectKeyRegex = /^(\w|\/|!|-|\.|\*|'|\(|\)| |&|\$|@|=|;|:|\+|,|\?)*$/
export const inverseValidObjectKeyRegex = /[^A-Za-z0-9_\/!\-.*'() &$@=;:+,?]/
