Contact: security@supabase.io
Canonical: https://supabase.com/.well-known/security.txt


At Supabase, we consider the security of our systems a top priority. But no matter how much effort we put into system security, there can still be vulnerabilities present.

If you discover a vulnerability, we would like to know about it so we can take steps to address it as quickly as possible. We would like to ask you to help us better protect our clients and our systems.

Out of scope vulnerabilities:

- Clickjacking on pages with no sensitive actions.
- Unauthenticated/logout/login CSRF.
- Attacks requiring MITM or physical access to a user's device.
- Attacks requiring social engineering.
- Any activity that could lead to the disruption of our service (DoS).
- Content spoofing and text injection issues without showing an attack vector/without being able to modify HTML/CSS.
- Email spoofing
- Missing DNSSEC, CAA, CSP headers
- Lack of Secure or HTTP only flag on non-sensitive cookies
- Deadlinks
- User enumeration

Testing guidelines:
- Do not run automated scanners on other customer projects. Running automated scanners can run up costs for our users. Aggressively configured scanners might inadvertently disrupt services, exploit vulnerabilities, lead to system instability or breaches and violate Terms of Service from our upstream providers. Our own security systems won't be able to distinguish hostile reconnaissance from whitehat research. If you wish to run an automated scanner, notify us at security@supabase.io and only run it on your own Supabase project. Do NOT attack projects of other customers.
- Do not take advantage of the vulnerability or problem you have discovered, for example by downloading more data than necessary to demonstrate the vulnerability or deleting or modifying other people's data.

Reporting guidelines:
- E-mail your findings to security@supabase.io.
- Do provide sufficient information to reproduce the problem, so we will be able to resolve it as quickly as possible.

Disclosure guidelines:
- In order to protect our customers, do not reveal the problem to others until we have researched, addressed and informed our affected customers.
- If you want to publicly share your research about Supabase at a conference, in a blog or any other public forum, you should share a draft with us for review and approval at least 30 days prior to the publication date. Please note that the following should not be included:
    - Data regarding any Supabase customer projects
    - Supabase customers' data
    - information about Supabase employees, contractors or partners

What we promise:
- We will respond to your report within 7 business days with our evaluation of the report and an expected resolution date.
- If you have followed the instructions above, we will not take any legal action against you in regard to the report.
- We will handle your report with strict confidentiality, and not pass on your personal details to third parties without your permission.
- We will keep you informed of the progress towards resolving the problem.
- In the public information concerning the problem reported, we will give your name as the discoverer of the problem (unless you desire otherwise).

We strive to resolve all problems as quickly as possible, and we would like to play an active role in the ultimate publication on the problem after it is resolved.
