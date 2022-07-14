/**
 * domain and IP address regex
 *
 * example of matches:
 *
 * "vercel.com"
 * "www.vercel.com"
 * "uptime-monitor-fe.vercel.app"
 * "https://uptime-monitor-fe.vercel.app/"
 * "127.0.0.0"
 *
 */
export const domainRegex =
  /^((ftp|http|https):\/\/)?(www.)?(?!.*(ftp|http|https|www.))[a-zA-Z0-9_-]+(\.[a-zA-Z]+)+((\/)[\w#]+)*(\/\w+\?[a-zA-Z0-9_]+=\w+(&[a-zA-Z0-9_]+=\w+)*)?$|^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.){3}(25[0-5]|(2[0-4]|1\d|[1-9]|)\d)$/gm

export const defaultDisabledSmtpFormValues = {
  SMTP_ADMIN_EMAIL: null,
  SMTP_SENDER_NAME: null,
  SMTP_USER: null,
  SMTP_HOST: null,
  SMTP_PASS: null,
  SMTP_PORT: null,
  SMTP_MAX_FREQUENCY: 60,
}
