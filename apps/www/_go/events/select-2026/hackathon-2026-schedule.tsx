import type { GoPageInput } from 'marketing'

const todaySql = `-- SELECT HACKATHON  ·  October 3, 2026  ·  YC
-- presented by Supabase, with support from Claude, Stripe and Vercel

SELECT * FROM today WHERE you = 'building';

-- RUN OF SHOW
-- +---------+-----------------------------------+
-- | time    | event                             |
-- +---------+-----------------------------------+
-- | 9:00 AM | sponsors arrive                   |
-- | 9:15 AM | doors open + check-in             |
-- | 9:45 AM | kickoff (theme drops on stage)    |
-- | 1:00 PM | lunch                             |
-- | 5:30 PM | !! submissions close + happy hour |
-- | 6:15 PM | demos (top teams)                 |
-- | 7:30 PM | awards                            |
-- +---------+-----------------------------------+

-- CONNECT
-- host:     [wifi network]
-- password: [wifi password]

-- SUBMIT  (before 5:30 PM) — one submission per team, at hackathon.supabase.com
INSERT INTO submissions (demo_video, screenshots, github_repo)
VALUES (...);

-- PRIZES  (API credits, per full team of 4)
-- +-----------------+------------------------------------------+
-- | place           | reward                                   |
-- +-----------------+------------------------------------------+
-- | grand           | up to 16,000 credits + founder breakfast |
-- | 2nd             | up to 8,000 credits                      |
-- | 3rd             | up to 4,000 credits                      |
-- | best use of ... | 1,000 credits (Claude / Stripe / Vercel) |
-- +-----------------+------------------------------------------+

-- HELP  (mentors roaming all day)
SELECT * FROM mentors WHERE you.stuck = true;
-- help desk: [location]  ·  YC 560 hacking  ·  YC 580 demos

-- hackathon.supabase.com`

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'select-2026/hackathon-2026-schedule',
  metadata: {
    title: 'Supabase Select Hackathon 2026',
    description:
      'Day-of one-pager for the Select Hackathon at YC, October 3, 2026. Run of show, wifi, how to submit, and prizes.',
  },
  hero: {
    title: 'Supabase Select Hackathon 2026',
  },
  sections: [
    {
      type: 'code-block',
      id: 'today',
      filename: 'selecthackathon2026.sql',
      language: 'sql',
      code: todaySql,
    },
  ],
}

export default page
