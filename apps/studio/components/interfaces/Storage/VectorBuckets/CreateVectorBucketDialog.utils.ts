/**
 * Rules: https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-vectors-buckets-naming.html?icmpid=docs_amazons3_console
 * Vector bucket names must be between 3 and 63 characters long.
 * Vector bucket names can consist only of lowercase letters (a-z), numbers (0-9), and hyphens (-).
 * Vector bucket names must begin and end with a letter or number.
 */
export const validVectorBucketName = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
