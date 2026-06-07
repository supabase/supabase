/**
 * Rules: https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-tables-buckets-naming.html?i
 * Bucket names must be between 3 and 63 characters long.
 * Bucket names can consist only of lowercase letters, numbers, and hyphens (-).
 * Bucket names must begin and end with a letter or number.
 * Bucket names must not contain any underscores (_) or periods (.).
 * Bucket names must not start with any of the following reserved prefixes: 
    xn--, sthree-, amzn-s3-demo-, aws
 * Bucket names must not end with any of the following reserved suffixes:
    -s3alias, --ol-s3, --x-s3, --table-s3
 */
export const reservedPrefixes = /^(?:xn--|sthree-|amzn-s3-demo-|aws)/
export const reservedSuffixes = /(?:-s3alias|--ol-s3|--x-s3|--table-s3)$/
export const validBucketNameRegex = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
