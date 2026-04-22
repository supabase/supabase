---
title = "PowerBI Service error: 'The remote certificate is invalid according to the validation procedure'"
date_created = "2026-04-22T12:04:18+00:00"
topics = [ "auth", "database", "storage" ]
keywords = []
---

Scheduled refreshes in Microsoft's PowerBI Service may fail with the following error:
`DataSource.Error: An error happened while reading data from the provider: 'The remote certificate is invalid according to the validation procedure.'`

## Why does this happen?

PowerBI Service enforces SSL certificate validation for cloud-based refreshes but does not natively trust Supabase’s self-signed CA certificates. Even if 'Use encrypted connection' is disabled in Power Query, the Service environment may still enforce validation during automated refreshes.

## How to resolve this

You can resolve this using one of the following methods:

- **Deploy an On-premises Data Gateway:** Install the PowerBI gateway on a host where you control the certificate store (such as a virtual machine). Download the CA certificate from the [Database Settings](/dashboard/project/_/settings/database) and install it into the machine's **Trusted Root Certification Authorities** store. Configure the PowerBI Service to perform refreshes via this gateway.

- **Use Intermediate Storage:** Automate an export of your data to a supported external source that PowerBI natively trusts, such as Azure Blob Storage or a CSV file on a web server. Connect PowerBI to that intermediate source instead of a direct Postgres connection.
