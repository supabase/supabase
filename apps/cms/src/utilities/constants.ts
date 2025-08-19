// https://cms-git-chore-fix-cms-types-supabase.vercel.app/
// https://zone-www-dot-com-git-chore-fix-cms-types-supabase.vercel.app/
export const WWW_SITE_ORIGIN =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ? 'https://supabase.com'
    : process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL?.replace('cms-git-', 'zone-www-dot-com-git-')}`
      : 'http://localhost:3000'
