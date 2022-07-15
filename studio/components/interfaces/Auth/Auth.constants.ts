// [Joshen] Currently using the latter regex as the former is too strict, doesn't support
// localhost - if we can combine these 2 together that'll be great but my regex-foo isn't too strong

// [MildTomato] Combined everything into domainRegex for now

// Regex from: https://stackoverflow.com/a/68002755/4807782
// modified to accept numbers in the body of domain though
// examples of matches:
//  "vercel.com"
//  "www.vercel.com"
//  "uptime-monitor-fe.vercel.app"
//  "https://uptime-monitor-fe.vercel.app/"
const baseDomainRegex =
  // v4 - now allows for paths at the end, including query params
  /^((ftp|http|https):\/\/)?(www.)?(?!.*(ftp|http|https|www.))[a-zA-Z0-9_*-]+(\.[a-zA-Z0-9_*-]+)+((\/)[\w#]+)*(\/\w+\?[a-zA-Z0-9_]+=\w+(&[a-zA-Z0-9_]+=\w+)*)?+(?:\.[a-z]+)*(?::\d+)?(?![^<]*(?:<\/\w+>|\/?>))(.*)?\/?(.)*$/gm
// v3 - now allows for port numbers at the end
// /^((ftp|http|https):\/\/)?(www.)?(?!.*(ftp|http|https|www.))[a-zA-Z0-9_*-]+(\.[a-zA-Z0-9_*-]+)+((\/)[\w#]+)*(\/\w+\?[a-zA-Z0-9_]+=\w+(&[a-zA-Z0-9_]+=\w+)*)?+(?:\.[a-z]+)*(?::\d+)?(?![^<]*(?:<\/\w+>|\/?>))$/gm
// v2 - now supports wildcards. does not allow "ftp"|"http"|"https"|"www" in subdoain though
// /^((ftp|http|https):\/\/)?(www.)?(?!.*(ftp|http|https|www.))[a-zA-Z0-9_*-]+(\.[a-zA-Z0-9_-]+)+((\/)[\w#]+)*(\/\w+\?[a-zA-Z0-9_]+=\w+(&[a-zA-Z0-9_]+=\w+)*)?$/gm
// v1
// /^((ftp|http|https):\/\/)?(www.)?(?!.*(ftp|http|https|www.))[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+((\/)[\w#]+)*(\/\w+\?[a-zA-Z0-9_]+=\w+(&[a-zA-Z0-9_]+=\w+)*)?$/gm

// [Joshen] This regex allows for localhost as well, less strict
// [MildTomato] no longer used
const webRegex = /^(ftp|http|https):\/\/\w+(\.\w+)*(:[0-9]+)?\/?(\/[.\w]*)*$/i

// iOS deep linking scheme https://benoitpasquier.com/deep-linking-url-scheme-ios/
const appRegex = /^[a-z0-9]+([.][a-z0-9]+)*:\/(\/[-a-z0-9._~!$&'()*+,;=:@%]+)+$/i

// Regex from https://stackoverflow.com/a/18696953/4807782
const localhostRegex = /^(?:^|\s)((https?:\/\/)?(?:localhost|[\w-]+(?:\.[\w-]+)+)(:\d+)?(\/\S*)?)/i

// combine the above regexes
export const domainRegex = new RegExp(
  `(${baseDomainRegex.source})|(${localhostRegex.source})|(${appRegex.source})`,
  'i'
)

// zone-www-dot-*-supabase.vercel.app
