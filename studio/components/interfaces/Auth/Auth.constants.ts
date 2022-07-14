// [Joshen] Currently using the latter regex as the former is too strict, doesn't support
// localhost - if we can combine these 2 together that'll be great but my regex-foo isn't too strong

// Regex from: https://stackoverflow.com/a/68002755/4807782
// examples of matches:
//  "vercel.com"
//  "www.vercel.com"
//  "uptime-monitor-fe.vercel.app"
//  "https://uptime-monitor-fe.vercel.app/"
export const domainRegexStrict =
  /^((ftp|http|https):\/\/)?(www.)?(?!.*(ftp|http|https|www.))[a-zA-Z0-9_-]+(\.[a-zA-Z]+)+((\/)[\w#]+)*(\/\w+\?[a-zA-Z0-9_]+=\w+(&[a-zA-Z0-9_]+=\w+)*)?$/gm

// [Joshen] This regex allows for localhost as well, less strict
export const domainRegex = /^(ftp|http|https):\/\/\w+(\.\w+)*(:[0-9]+)?\/?(\/[.\w]*)*$/g
