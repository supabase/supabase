// [Joshen] Currently using the latter regex as the former is too strict, doesn't support
// localhost - if we can combine these 2 together that'll be great but my regex-foo isn't too strong

// Regex from: https://stackoverflow.com/a/68002755/4807782
// examples of matches:
//  "vercel.com"
//  "www.vercel.com"
//  "uptime-monitor-fe.vercel.app"
//  "https://uptime-monitor-fe.vercel.app/"
export const domainRegexStrict =
  /^((ftp|http|https):\/\/)?(www.)?(?!.*(ftp|http|https|www.))[a-zA-Z0-9_-]+(\.[a-zA-Z]+)+((\/)[\w#]+)*(\/\w+\?[a-zA-Z0-9_]+=\w+(&[a-zA-Z0-9_]+=\w+)*)?$/m

// [Joshen] This regex allows for localhost as well, less strict
export const webRegex = /^(ftp|http|https):\/\/\w+(\.\w+)*(:[0-9]+)?\/?(\/[.\w]*)*$/i

// iOS deep linking scheme https://benoitpasquier.com/deep-linking-url-scheme-ios/
export const appRegex = /^[a-z0-9]+([.][a-z0-9]+)*:\/(\/[-a-z0-9._~!$&'()*+,;=:@%]+)+$/i

export const domainRegex = new RegExp(`(${webRegex.source})|(${appRegex.source})`, 'i')
