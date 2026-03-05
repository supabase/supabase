---
title: 'What is PostgreSQL commitfest and how to contribute'
description: 'A time-tested method for contributing to the core Postgres code'
author: pavel
imgSocial: what-is-postgres-commitfest/what-is-postgres-commitfest.jpg
imgThumb: what-is-postgres-commitfest/what-is-postgres-commitfest.jpg
categories:
  - postgres
tags:
  - postgres
  - planetpg
date: '2022-10-27'
toc_depth: 3
---

The PostgreSQL community has a specific, effective, and time-tested method for contributing to the core code.

Proposals and changes to PostgreSQL (called patches) are submitted via email to the common Postgres hackers' mailing list pgsql-hackers@postgresql.org. Then you can track all activity simply by reading your mailbox. You can also follow this mailing list online at [postgresql.org/list/pgadmin-hackers](https://www.postgresql.org/list/pgadmin-hackers/).

The mailing list contains a lot of different discussions. Some of the patches are preliminary POCs (proof-of-concept) not to be committed to the core directly, and some are urgent bug fixes. When a feature is intended for merging this should be done by creating a Commitfest entry, which resembles a pull request.

## What is Commitfest?

Commitfest is a month-long activity where Postgres contributors and core staff (committers) dedicate to looking at the patches, reviewing them, improving, and committing to the master branch. Effectively these are the months you most probably get feedback on your patches.

There are 5 commitfests each year. You can see the schedule at [commitfest.postgresql.org](https://commitfest.postgresql.org/). You can only attach a patch to a commitfest **that hasn't started yet** (i.e. before 1st day of a commitfest month).

## Why participate in Commitfest?

There are numerous benefits:

- You gain knowledge of PostgreSQL internals by reviewing other hackers' patches, and grow your profile within the community.
- The process of reviewing involves more senior PostgreSQL experts and as a rule, the code proposed becomes better.
- Lower risk for your code. If you're running a fork or extension that diverges from PG core then only you are responsible for its maintenance. Once it is merged, the entire community will help with maintenance and the API becomes the "official" way to do it.
- PostgreSQL commits are likely to survive longer than you do. Like a book manuscript, you get to leave a small history in the world.
- To re-enforce the community. Many features, like performance, have diverse options and many people discuss how to make them better. This is more effective when you join the party.

## Which patches are welcome on a Commitfest?

Generally, all patches that touch the core code are welcome. It's not necessary that they are complex. In fact, it's an excellent strategy to start by fixing or improving something small.

The main topics to propose are: bugfixes, performance, server features, clients, security, SQL commands, testing improvements, replication and recovery, procedural languages, code refactoring (yes, it's very important!), monitoring and control, and documentation.

Some ideas on what to submit:

- Very small and uncontroversial fixes (especially bug fixes) have a good chance to be reviewed and committed even before Commitfest. If they aren't, just attach it to commitfest.
- If you make your feature an extension, the chance of committing it to the core is small. There are nice extensions like Pageinspect and Amcheck, that are committed into PG code as contribs but it is rare (contribs - are extensions that are inside the main PG package)
- There is no need to propose patches to refine translations, .po files etc. This is done by specialists. If you have user-visible messages in your patch just leave it English-only.
- Refining documents, readmes, and comments are welcome if they are clear and precise enough. You can propose a fix for only one line of comment but please don't do nitpicking.
- Performance-related features should better demonstrate performance increase at least in some use cases and no performance degradation in others.
- If your patch changes user behavior be ready to discuss and rework the interface. It's not easy to reach an agreement among many hackers with varying opinions.

You can find a list of patches for the upcoming commitfest here: [commitfest.postgresql.org/40](https://commitfest.postgresql.org/40/)

## Quick steps on how to make a patch

Make a git branch that is based on the most recent master branch ([github.com/postgres/postgres](https://github.com/postgres/postgres)):

```bash
git clone https://github.com/postgres/postgres
git checkout master
git checkout -b your_branch_name
```

Add your code to the branch (i.e. cherry-pick your commits from another branch).

Rebase and squash your patch code to be 1 commit against master:

```
git rebase -i HEAD~5

# This will take the last 5 commits in a branch
# and you can do anything with them:
# squash, change order, change commit message, etc
```

Edit your commit message to be meaningful and clear. Be concise, but don't be too short. Reviewers enjoy understanding the purpose of a patch and what it does. This is especially important if the patchset consists of several patches. The first line of the commit message will become the patch name on a step later so make that line particularly clear and concise.

Don't forget to add all the patch authors with their emails to the commit message.

```
git format-patch -1 -v13

# 1   = patch depth.
#       The number of topmost patches to include
# v13 = the patch version.
#       Make new version number anytime you want to
#       send updated patch to the same thread)
```

Attach the file(s) to an email message (they look like `v13-0001-Naming-of-a-patch.patch`)

Compose email message to pgsql-hackers@postgresql.org. Write all rationale and details of your proposal. The main thing to bear in mind is that attracting attention to your proposal is like 50% of success. Also, please be polite.

It's encouraged to split complicated patches into several independently working parts as it's much easier to review (although not all complicated patches are easy to decompose).

## Submitting to a Commitfest thread

After you have created a patch, you can attach it to a Commitfest thread:

- Make sure that you have sent email with your patch to the pgsql-hackers@postgresql.org mailing list
- Open commitfests page [commitfest.postgresql.org](https://commitfest.postgresql.org/) and choose the nearest commitfest with the status "Open"
- Click "New patch" button.
- Create a concise description, chose the relevant topic, and fill in the msgid in the hackers mailing list to attach a thread (which can be found in a full header of a mail message e.g.`Message-ID: <CANbhV-FG-1ZNMBuwhUF7AxxJz3u5137dYL-o6hchK1V_dMw86g@mail.gmail.com>`)
- Click "Create patch" button.

That's all. Congrats!

## After your patch is submitted to commitfest

After you have a submitted your patch, several things will happen:

- It will appear on CI page [cfbot.cputube.org](http://cfbot.cputube.org/) which will check its health against several architectures and OSes. If the patch has any errors then you should fix/rebase it. New versions of patches sent in messages replying to the mail thread are taken by CFBot automatically. Send updated versions of all patches in a patchset even if only one changed, otherwise cfbot will not take it properly. Clean status patches will attract reviewers' and committers' attention first.
- It will get "Needs review" status and anyone could add a review and change it to "Ready for committer" or "Waiting on author".
- You are supposed to **answer the questions** and communicate on your patch regularly during commitfest. That includes fixing the things the other hackers propose. It's likely better to follow their opinion and it almost always takes much less effort than arguing. Be polite, even if comments seem like nitpicking (probably they are not, actually).
- Give back. You are supposed to **review** the same number of patches that you proposed to commitfest and with similar complexity. You can choose what to review based on your interest, your knowledge of a particular part of Postgres (e.g. indexes or planner things), or even your personal acquaintance with the author. As a rule of thumb, you are supposed to specify if you are from the same company as the author (it is not prohibited but this should be clear, the best way is just to add your company to the email signature).

The commit process is a two-step:

1.  Preliminary review. It could be done by anyone (including you). A detailed guide on how to do this [wiki.postgresql.org/wiki/Reviewing_a_Patch](https://wiki.postgresql.org/wiki/Reviewing_a_Patch) If there are no doubts reviewer sets the status to "Ready for committer". If the patch needs some changes a reviewer can set "Waiting on author". Reviewers can leave a favorable review but that's only a signal. After other reviewers join the conversation, if there are no objections then one of them will make it "Ready for committer". It's pretty normal if there is more than one reviewer. In fact the more reviewers, the better.
2.  Final review by a committer. Committers are the most senior members of a community and it's a formal status. The list of committers: [wiki.postgresql.org/wiki/Committers](https://wiki.postgresql.org/wiki/Committers) As a result a committer can commit it or push back to "Waiting on author", or "Need review".

The time and attention of committers are limited, which is why there is a two-step process. Some patches that pass the initial review won't receive reviewers' attention. In that case, they will be transferred to the next commitfest automatically.

## When does the commitfest finish?

CF finishes around the 1st day of the next month (i.e. November CF starts on November 1 and finishes on December 1). For any patches that do not get merged:

- Patches with the status "Ready for committer" or "Need review" will be transferred to the next CF.
- Patches with the status "Waiting on author" are transferred automatically if the questions and proposals in the thread are not unaddressed for more than 2 weeks. Otherwise, it will be dropped from CF with "Returned with feedback".

All these "automatic" things are actually done by commitfest managers (volunteers), so if you have any requests, doubts, or questions you can write them personally.

Please note that hackers almost never reject patches! They just return it and the author if he is still willing and has time to work on the patch further can attach it (the same thread) to the next commitfest anytime.

## What is feature-freeze?

Feature-freeze is an annual event that targets patches released into a major PostgreSQL version. Feature-freeze for the "current-year" release is at the end of a March commitfest. All patches committed on and before will be released in the PG major release (in October). Everything committed after March (July, September, etc) will go into next year's major release.

For that reason, the March Commitfest takes **10-15 days longer** than the usual 1 month, finishing in mid-April. It's important for the author to continue watching your patches and feedback until that time. Commits in early April are big!

## Important tips

- If you want to discuss something with hackers without a thread overhead (which makes it more difficult to read by other hackers) you can wipe out pgsql-hackers@postgresql.org from the reply list and leave only the participants you want. If you do this, you should add `[offlist]` to the message subject to prevent confusion.
- The hackers mail list receives _a lot_ of messages. It's advisable to set up mail filtering so that hackers' messages are sorted into separate places and shown as threads. But ensure that all messages that contain **your address** will NOT go into this place so that you can read all answers to your proposal among your prioritized emails.
- Patches that need minor rework like rebase or comments refine are pushed back to "Waiting on author". Therefore, almost-ready patch very often stall, waiting for a new review, during which it will need another rebase and it goes into a vicious circle. If you are certain that the change is minor and doesn't affect functionality, you can return the patch to the same state it had before (if it was "Ready-for-committer" it should be ready for committer even after rebase). It's good manners to mention this change in a hacker's thread to remove suspicions that you want to hijack the patch status.
- It’s very good to be proactive with your patch not only change something on request. Sometimes it’s hard to describe in detail what needs improving and hackers may give only approximate direction of work. If you see criticism it’s very good to answer this with possible proposals on how can you change the code, or what measurements you can do to drop possible doubts about functionality or performance.
- It’s also very nice to keep watching activity in the patch thread after it is committed. Sometimes small problems arise later and you can propose a separate fix and get a reputation as a responsible contributor. Also, you know your code better and it would be very valuable for everyone though other hackers could help you with this.

If you're interested in contributing to PostgreSQL full time, [Supabase is hiring Postgres Core Contributors](https://boards.greenhouse.io/supabase/jobs/4307456004).

## More Postgres resources

- [Postgres Full Text Search vs the rest](https://supabase.com/blog/postgres-full-text-search-vs-the-rest)
- [Postgres WASM by Snaplet and Supabase](https://supabase.com/blog/postgres-wasm)
- [Choosing a Postgres Primary Key](https://supabase.com/blog/choosing-a-postgres-primary-key)
- [Implementing "seen by" functionality with Postgres](https://supabase.com/blog/seen-by-in-postgresql)
- [Partial data dumps using Postgres Row Level Security](https://supabase.com/blog/partial-postgresql-data-dumps-with-rls)
- [Postgres Views](https://supabase.com/blog/postgresql-views)
- [Realtime Postgres RLS on Supabase](https://supabase.com/blog/realtime-row-level-security-in-postgresql)
