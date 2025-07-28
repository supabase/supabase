---
title = "Using Google SMTP with Supabase Custom SMTP"
github_url = "https://github.com/orgs/supabase/discussions/19646"
date_created = "2023-12-13T01:40:37+00:00"
topics = [ "auth", "platform" ]
keywords = [ "smtp", "google", "workspace", "2FA", "TLS", "encryption", "port" ]
database_id = "4d5390a0-445d-4e0a-ae7e-9b713b7cc4f6"
---

Hey everyone, i've been hearing feedback about how challenging it can be to get google SMTP working properly with Supabase. I've tried setting this up with a trial google workspace account and this is what i've discovered.

1. The sender email and SMTP username has to be your google workspace admin email.
2. The SMTP password used has to be an app password. Google workspace doesn't make it easy to to figure out how to create this. You need to **enable 2FA** on your workspace account first (not inside the admin console but in https://myaccount.google.com/)
3. If you want to use `smtp-relay.gmail.com` only port 465 works. If you want to use `smtp.gmail.com`, you can use port 465 or 587.
   The following screenshots show what those steps look like:

## For `smtp-relay.gmail.com`

![image](/docs/img/troubleshooting/800448a1-0245-4a26-855f-3be8f44adf03.png)

(The "Require TLS encryption" option didn't seem to affect anything when tested)![image](/docs/img/troubleshooting/5b55ddbc-abfc-4c66-a012-b8e4d23cd438.png)

## For `smtp.gmail.com`

![image](/docs/img/troubleshooting/ade24c85-50b5-47ca-a2ce-c3f77a0e128a.png)

A lot of this was figured out through trial and error.
This is unlikely to be a Supabase Auth bug because Supabase Auth uses the [native Golang SMTP library ](https://pkg.go.dev/net/smtp). If you still have issues setting up Google SMTP, you can try switching to one of these SMTP providers:

- [Resend](https://resend.com/blog/how-to-configure-supabase-to-send-emails-from-your-domain)
- [SendGrid](https://sendgrid.com/en-us)
- [Mailgun](https://www.mailgun.com/)
- AWS SES SMTP
