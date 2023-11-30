/**
 * This dummy page is added because of a bug in Nextjs. If you only have API routes in /app folder,
 * for some reason it adds the base path twice to some of the links in the /pages folder
 * (database/indexes for example). The only way is to have a dummy page which somehow calms Nextjs
 *  down. This solution was found in https://github.com/vercel/next.js/issues/54770.
 */
export default function Page() {
  return <></>
}
