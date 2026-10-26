# Security Policy

Thank you for helping keep Supabase and its users safe.

## Reporting a vulnerability

Please report suspected vulnerabilities through our HackerOne program:
<https://hackerone.com/supabase>. Please do not open public GitHub issues or
pull requests for security problems.

The program-wide rules are repeated below, under "Out of scope for every
Supabase asset" and "Testing and disclosure". They also live at
<https://supabase.com/.well-known/security.txt>.

This repository is the main Supabase monorepo. It contains Supabase Studio (the
dashboard), the documentation and marketing sites, the Docker-based
self-hosting stack (the API gateway configuration, `.env` templates and
compose files), and example and template code. Other Supabase components, such
as Auth, Storage, Realtime, postgres-meta and the CLI, have their own
repositories and their own security policies. Studio and the self-hosting stack
run on the hosted Supabase platform and are also run by people who self-host
them. We accept reports for both, and we triage them differently (see "Hosted
vs. self-hosted" below).

## What we consider a vulnerability

In general, we want to hear about anything that lets an attacker break the
security guarantees that Supabase makes to its users and projects: gaining
access to another user's account, data or secrets, acting with more privilege
than they were granted, running code in the dashboard or documentation origins,
or crossing a boundary between users, organizations or projects. The attacker
should not need the victim's credentials or project privileges, and the problem
should be present on the hosted platform or in the default self-hosted
configuration.

Examples of what this includes (these are illustrations, not a complete list):

- **Script execution in a Supabase origin.** Stored or reflected XSS in the
  dashboard, documentation or other Supabase-owned sites, including content
  served inline from storage or image optimization, MDX or Markdown rendered
  from untrusted input, and redirect or `returnTo` parameters that can reach
  `javascript:` URLs. Script execution must be shown in the site's own origin.
- **Open redirects that deliver tokens or codes.** Redirect validation that can
  be bypassed in the dashboard, sign-in flows, or the sample and template code
  we ship.
- **Missing authentication or authorization on dashboard and platform
  endpoints.** Endpoints, server actions or API routes that act with
  server-held credentials without checking who is calling, accept
  caller-supplied integration configuration, or let a lower-privileged user
  read or change something that needs a higher role. Unauthenticated endpoints
  that spend money, such as AI features, are in scope when you show how they
  can be abused.
- **Cross-tenant access.** One organization's or project's data, keys or
  settings being reachable from another.
- **A flaw in the default self-hosted stack.** Anything an unauthenticated
  attacker can reach or do against the documented Docker setup, with only the
  secrets changed as the guide instructs. That includes gateway routes that
  expose an internal service, gateway rules that can be bypassed with path
  manipulation, and credentials in the shipped defaults that are real and
  usable.
- **Injection in generated or privileged SQL.** Unescaped values that reach SQL
  run with more privilege than the caller has, or that are executed without the
  user's knowledge.
- **Secrets exposed to someone who should not see them.** API keys, service
  credentials or tokens appearing in API responses, URLs, logs or committed to
  this repository while still live.
- **Build and release pipeline compromise.** CI workflows or scripts in this
  repository that let untrusted input run with access to secrets or to
  production deploys.

## What we do not consider a vulnerability

Reports that rely on the behavior below will normally be closed as
informative or not applicable.

**By design in the self-hosted stack**

- **Studio has no login of its own when self-hosted.** The gateway in front of
  it provides authentication, and it is not meant to be exposed to untrusted
  networks. Reaching Studio or its internal APIs by exposing it to the internet,
  or from inside the container network, is a deployment matter.
- **Placeholder credentials and keys.** The passwords, JWT secrets and keys in
  `.env.example` and the Docker templates are documented sample values that
  operators must replace. Reports that they exist, or that a deployment which
  never changed them is weak, are not vulnerabilities. A live production
  credential in the repository is a different matter.
- **Storage and Edge Functions routes have no gateway-level auth.** They are
  public products that match the hosted platform. Authorization is enforced by
  the services themselves: Storage access policies, and the checks you write in
  your functions. `verify_jwt` is a basic access check that also accepts the
  `anon` key and is not meant as strong authorization.
- **Studio running in local development mode** (outside the Docker stack) has no
  gateway authentication, and is not a documented self-hosted setup.
- **The Studio MCP endpoint** is disabled by default, and the configuration
  documents the risk of turning it on.
- **The database user in the self-hosted stack is a superuser.** Studio and
  postgres-meta can run privileged SQL for anyone who is allowed to use them.

**Features that are privileged by design**

- **The SQL editor and the postgres-meta query endpoint run arbitrary SQL**,
  including multiple statements, as a privileged role. Injection into other
  parameters of that endpoint is only interesting if it crosses a boundary the
  endpoint does not already grant, such as reaching it as a lower-privileged
  user.
- **Studio's "View as role" impersonation** is a convenience feature, not a
  security boundary, for someone who already has full Studio access.
- **Outbound requests made on your behalf.** Edge Functions are user-deployed
  code and can make requests to the public internet, and so can the database
  with extensions like `http` or `pg_net` when you enable them. On the hosted
  platform internal networks and metadata services are not reachable. Studio
  features such as the Edge Function test proxy require dashboard access, which
  already allows running SQL and deploying functions. A report must show a
  bypass of the hosted protections, or access to something the caller could not
  otherwise reach.
- **Customer configuration.** Tables without Row Level Security, an extension
  installed into an exposed schema, and a `service_role` key shipped in a
  client are the customer's responsibility. An RLS bypass must be reproduced on
  a table with correct policies.

**Public by design**

- **The `anon` / publishable key in client code.** It is meant to be public.
  Security comes from RLS.
- **Open-source content.** Prompts for our AI assistant, the dashboard's static
  UI shell with JavaScript disabled, and standard private IP ranges in client
  code are public.
- **Unauthenticated routes that only forward to an already public API**, with no
  non-public data shown.
- **Internal apps in the monorepo.** The CMS and similar internal apps are
  Supabase-operated, not part of the product, and local-development behavior in
  them is out of scope. Partner and marketplace listing content is created and
  moderated by Supabase.

**Prerequisites that make the attack pointless**

- The attacker needs full dashboard or project-admin access, or the service-role
  key. They already hold what you describe.
- The attacker needs existing script execution in the victim's browser, or a
  malicious browser extension. For example, an attack on the strength of
  `Math.random()` for a short-lived OAuth state nonce.
- The preview runs in a sandboxed iframe with no access to the parent origin,
  cookies or storage, such as the email template preview.

**Missing hardening or noise**

- **Dependency CVEs** in example or demo code that is not deployed, or in code
  paths that are not reachable in a shipped service. Show that the vulnerable
  code runs. Dependency-confusion reports must show an install actually
  resolving an internal package name from the public registry.
- **Permissive image or SVG configuration** with no demonstrated script
  execution in the site's origin. Content-spoofing in static generated images
  served from a customer subdomain.
- **CI workflow reports** about fork pull-request previews that maintainers
  approve, or that only produce a preview build. Production deploys come only
  from the main branch.
- **Automated scanner output**, untested multi-issue submissions, and framework
  CVE fingerprints with no exploitation.

## Out of scope for every Supabase asset

These are excluded program-wide (see also
<https://supabase.com/.well-known/security.txt>). They are repeated here so
you do not need to leave this repository to find them.

- Clickjacking on pages with no sensitive actions.
- Unauthenticated, logout and login CSRF.
- Attacks requiring MITM or physical access to a user's device.
- Attacks requiring social engineering.
- Any activity that could lead to the disruption of our service (DoS).
  This means volumetric attacks, load testing and flooding. A vulnerability in
  our code that lets an unprivileged attacker crash a service or exhaust
  resources for other users or tenants is in scope. Denial of service that only
  affects the attacker's own project, or that needs admin or owner privileges,
  is not.
- Content spoofing and text injection issues without showing an attack vector,
  or without being able to modify HTML/CSS.
- Email spoofing.
- Missing DNSSEC, CAA or CSP headers.
- Lack of Secure or HttpOnly flags on non-sensitive cookies.
- Dead links.
- User enumeration.

## Known and documented behavior

These are described in our documentation or in the shipped configuration.
Please check them before reporting.

- **Self-hosting hardening.** Self-hosted Studio is not designed to be exposed
  to untrusted networks. Put it behind the gateway, change every placeholder
  secret, and restrict egress. See the self-hosting guide.
- **Edge Functions self-hosted.** Self-hosted functions may live on any endpoint
  and may need to reach internal networks, so egress restriction is the
  operator's job.

## Hosted vs. self-hosted

If your finding only applies when someone self-hosts with an insecure setting
(an exposed Studio, unchanged secrets, a removed gateway plugin), label it
"self-hosted, custom configuration" and list the settings you changed (see
below). We accept self-hosted findings when the shipped defaults or the
documented setup lead to the problem, and we treat them as lower severity when
the operator has to misconfigure the deployment first.

## How to write a report that gets triaged quickly

- **Say what you tested, at the top of the report and in the title.** Use one of
  these labels, for example `[Production] ...` in the title and a "Target" line
  at the start of the description:
  - **Production**: the hosted Supabase platform, against a project you own.
    Include the project ref. Never test another customer's project.
  - **Self-hosted, default configuration**: the code in this repository run
    exactly as shipped or as our self-hosting guide describes, using the
    Docker setup with only the secrets changed as the guide instructs. Include
    the commit and how you started it. Running Studio directly in local
    development mode is not the documented self-hosted setup.
  - **Self-hosted, custom configuration**: you changed settings, added a proxy,
    or modified code. List every setting you changed and why. We triage these
    lower unless the setting is one we recommend or document.

  Reports that do not say which of the three they are about are slower to
  triage, and are often closed with a request to retest. A finding that works
  only on a custom configuration is not a finding against production.
- **Test a real deployment.** Code reading alone is rarely enough. Static
  analysis findings need a working proof of concept against one of the targets
  above, and for the self-hosted stack, the documented Docker setup and not just
  a local dev server.
- **Give a short, runnable PoC.** Exact requests, a script or a screen
  recording, and the output showing the impact. Confirm that the attacker really
  got something they should not have. A callback from your own browser is not
  proof of server-side behavior.
- **State the attacker's starting position.** What do they already know or hold
  (an anonymous request, a leaked anon key, dashboard access, project admin)?
  Reports that quietly assume the attacker already has full access are our most
  common reason to close.
- **Name the boundary you crossed.** Which user, organization or project could
  not do this before? If nothing was crossed, it is probably a hardening
  suggestion.
- **Check the docs, this file and past disclosures first.** If the behavior is
  documented or already known, explain why it still fails. Many self-hosted
  Studio reports are duplicates of the same few findings.
- **Do not overstate severity.** A critical rating for an endpoint that is
  privileged by design costs credibility. Say what the realistic impact is.
- **Include versions.** The commit or release you tested and, for self-hosted
  reports, the relevant `.env` and gateway settings.
- **One issue per report.** Link variants of the same root cause instead of
  filing each variant separately.
- **Do not send unreviewed AI output.** Reports that were not reproduced by a
  human and that ignore the documentation are closed. AI-assisted analysis is
  fine when you have verified the result.
- **Respond to follow-up questions.** Reports that go quiet after we ask for a
  reproduction are closed.

## Severity

We rate severity by realistic impact on a default deployment. Issues that need
an unusual configuration, an existing privilege, or a strong prerequisite are
rated lower even when they are valid, and we may fix them as defense in depth.

## Testing and disclosure

These are our program-wide rules. They also apply to AI agents and automated
tools acting on your behalf.

**Testing**

- Do not run automated scanners against other customers' projects. Scanners can
  run up costs for our users, can disrupt services, and our own security
  systems cannot tell hostile reconnaissance from research. If you want to run
  an automated scanner, notify security@supabase.com first and run it only on
  your own Supabase project.
- Do not attack projects that belong to other customers.
- Do not take advantage of a vulnerability you find, for example by downloading
  more data than necessary to demonstrate it, or by deleting or modifying other
  people's data.

**Reporting**

- File a report through our HackerOne program at
  <https://hackerone.com/supabase>.
- Give enough information for us to reproduce the problem.

**Disclosure**

- Do not reveal the problem to others until we have researched and fixed it and
  informed affected customers.
- If you want to share your research publicly (a conference, a blog or any
  other public forum), send us a draft for review and approval at least 30 days
  before the publication date. Do not include data about Supabase customer
  projects, customers' data, or information about Supabase employees,
  contractors or partners.

**What we promise**

- We will respond to your report within 5 business days with our evaluation and
  an expected resolution date.
- If you have followed these instructions, we will not take legal action against
  you in regard to the report.
- We will handle your report with strict confidentiality and will not pass on
  your personal details to third parties without your permission.
- We will keep you informed of our progress.
- In public information about the problem, we will name you as the discoverer
  unless you prefer otherwise.
